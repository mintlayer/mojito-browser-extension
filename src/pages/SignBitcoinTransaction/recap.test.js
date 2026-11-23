import { BTCTransaction } from '@Cryptos'
import {
  BTC_REQUEST_KIND,
  parseSatoshiAmount,
  buildBtcSignRecap,
  classifyBtcSignRequest,
} from './recap'
import { MOCKS } from './mocks'

describe('parseSatoshiAmount', () => {
  it('accepts positive integer strings and numbers', () => {
    expect(parseSatoshiAmount('100')).toBe(100)
    expect(parseSatoshiAmount('  42  ')).toBe(42)
    expect(parseSatoshiAmount(123)).toBe(123)
  })

  it.each(['1.5', '100abc', '-5', '', 'abc', null, undefined, '0', '1e3'])(
    'rejects %p',
    (input) => {
      expect(() => parseSatoshiAmount(input)).toThrow(/Invalid HTLC amount/)
      try {
        parseSatoshiAmount(input)
      } catch (e) {
        expect(e.code).toBe('INVALID_AMOUNT')
      }
    },
  )

  it('rejects values above the safe integer range', () => {
    expect(() => parseSatoshiAmount('99999999999999999999')).toThrow(
      /positive integer/,
    )
  })
})

describe('buildBtcSignRecap', () => {
  const networkType = 'testnet'
  const SATS_PER_BTC = 100000000

  it('returns null only without a payload', () => {
    expect(buildBtcSignRecap({ json: null, networkType })).toBeNull()
  })

  // The fourth shape: no secret hash and a type that is neither the claim
  // nor the refund. The recap states that it is unrecognised and blocks
  // approval, and the submit handler has no signer for it; the type is
  // shown as text when it is one.
  it.each([
    ['an absent type', {}, 'missing'],
    ['a null type', { type: null }, 'missing'],
    ['an empty type', { type: '' }, 'missing'],
    ['a type that is an object', { type: { toString: 1 } }, 'unreadable value'],
    ['a type that is a number', { type: 42 }, 'unreadable value'],
    ['an unrecognised type', { type: 'transfer' }, 'transfer'],
  ])('blocks an unrecognised request with %s', (_shape, json, shown) => {
    const recap = buildBtcSignRecap({ json, networkType })

    expect(recap.title).toBe('Unrecognised request')
    const row = recap.rows.find((r) => r.label === 'Request type')
    expect(row.value).toBe(shown)
    expect(recap.blockedReason).toMatch(/^Unrecognised request/)
    expect(recap.blockedReason).toMatch(/cannot be approved/)
  })

  // A payload that matches more than one kind — a refund or claim type next
  // to the secret hash of a new HTLC — used to be shown as a create (with
  // its amount, escrow address and lock time) while the submit handler
  // signed a refund or claim of an existing HTLC output. It is ambiguous:
  // shown as nothing but that, and never signed.
  it.each([
    ['a refund', 'refundHtlc', MOCKS.refundHtlc, 'a refund and a new HTLC'],
    [
      'a claim',
      'spendHtlc',
      MOCKS.spendHtlc,
      // the kinds are named in the classifier's order: refund, create, spend
      'a new HTLC and a claim',
    ],
  ])(
    'blocks a payload that is both %s and a new HTLC',
    (_shape, type, other, described) => {
      const json = {
        ...MOCKS.createHtlc.request.data.txData.JSONRepresentation,
        ...other.request.data.txData.JSONRepresentation,
        type,
      }
      const recap = buildBtcSignRecap({ json, networkType })

      expect(recap.title).toBe('Ambiguous request')
      // none of the create, claim or refund facts are shown for it
      expect(recap.rows.map((r) => r.label)).toEqual([
        'Request type',
        'Network',
      ])
      expect(recap.rows[0].value).toBe(type)
      expect(recap.blockedReason).toBe(
        `Ambiguous request: this payload describes both ${described}, so the wallet cannot tell which transaction to sign. For your safety, this request cannot be approved.`,
      )
    },
  )

  describe('classifyBtcSignRequest', () => {
    // The ONE classifier: the recap shows a request by it and the submit
    // handler signs by it.
    it.each([
      ['createHtlc', BTC_REQUEST_KIND.CREATE],
      ['spendHtlc', BTC_REQUEST_KIND.SPEND],
      ['spendHtlc2', BTC_REQUEST_KIND.SPEND],
      ['refundHtlc', BTC_REQUEST_KIND.REFUND],
    ])('classifies the %s fixture as a single-kind request', (name, kind) => {
      expect(
        classifyBtcSignRequest(
          MOCKS[name].request.data.txData.JSONRepresentation,
        ),
      ).toBe(kind)
    })

    it('goes by the matches only: an empty secret hash is no create, an unrelated type is no kind', () => {
      expect(
        classifyBtcSignRequest({ type: 'refundHtlc', secretHash: '' }),
      ).toBe(BTC_REQUEST_KIND.REFUND)
      expect(
        classifyBtcSignRequest({ secretHash: '{}', type: 'transfer' }),
      ).toBe(BTC_REQUEST_KIND.CREATE)
      expect(classifyBtcSignRequest({ type: 'transfer' })).toBe(
        BTC_REQUEST_KIND.UNRECOGNISED,
      )
      expect(classifyBtcSignRequest(null)).toBe(BTC_REQUEST_KIND.UNRECOGNISED)
    })

    it.each([
      [
        'a refund type next to a secret hash',
        { type: 'refundHtlc', secretHash: '{"secret_hash_hex":"ab"}' },
      ],
      [
        'a claim type next to a secret hash',
        { type: 'spendHtlc', secretHash: { toString: 1 } },
      ],
    ])('classifies %s as ambiguous', (_shape, json) => {
      expect(classifyBtcSignRequest(json)).toBe(BTC_REQUEST_KIND.AMBIGUOUS)
    })
  })

  it('summarizes an HTLC create request with escrow, amount and fee', () => {
    const recap = buildBtcSignRecap({
      json: {
        secretHash: '{"secret_hash_hex":"ab"}',
        amount: '20000',
        timeoutBlocks: 500,
      },
      networkType,
      escrowFeeInfo: {
        htlc: { p2wshAddress: 'tb1qescrow' },
        feeRate: 10,
        estimatedFee: 1540,
      },
    })

    expect(recap.title).toBe('Create HTLC — fund an escrow')
    const byLabel = Object.fromEntries(
      recap.rows.map((r) => [r.label, r.value]),
    )
    expect(byLabel['You are sending']).toBe('0.00020000 BTC (20000 sat)')
    expect(byLabel['Escrow address']).toBe('tb1qescrow')
    expect(byLabel['Fee (estimate)']).toBe('1540 sat @ 10 sat/vB')
    expect(byLabel['Refund locktime']).toBe('500 blocks')
    expect(recap.warning).toBeTruthy()
  })

  it('flags an unparseable create amount instead of showing a wrong number', () => {
    const recap = buildBtcSignRecap({
      json: { secretHash: '{}', amount: '1.9' },
      networkType,
    })

    const amountRow = recap.rows.find((r) => r.label === 'You are sending')
    expect(amountRow.value).toContain('Unparseable amount')
    expect(amountRow.warn).toBe(true)
  })

  it('summarizes an HTLC claim with destination and secret exposure', () => {
    const recap = buildBtcSignRecap({
      json: {
        type: 'spendHtlc',
        to: 'tb1qmine',
        utxo: { txid: 'f'.repeat(64), vout: 0, value: 2000 },
      },
      networkType,
    })

    expect(recap.title).toBe('Claim HTLC')
    const byLabel = Object.fromEntries(
      recap.rows.map((r) => [r.label, r.value]),
    )
    expect(byLabel['You are claiming']).toBe('0.00001500 BTC (500 sat fee)')
    expect(byLabel['Paid to']).toBe('tb1qmine')
    expect(byLabel['Secret']).toContain('revealed on-chain')
  })

  it('warns when the claim amount is unknown', () => {
    const recap = buildBtcSignRecap({
      json: { type: 'spendHtlc', to: 'tb1qmine' },
      networkType,
    })

    const row = recap.rows.find((r) => r.label === 'You are claiming')
    expect(row.warn).toBe(true)
  })

  // The background forwards dApp params unvalidated. A value that is not
  // text is never stringified or numbered (an object with an own
  // non-callable toString throws on both); it is described, and a value the
  // signer cannot read blocks approval.
  it('never throws on an unreadable create amount and lock time, and blocks approval', () => {
    const shadow = { toString: 1 }
    const recap = buildBtcSignRecap({
      json: { secretHash: '{}', amount: shadow, timeoutBlocks: shadow },
      networkType,
    })

    const byLabel = Object.fromEntries(
      recap.rows.map((r) => [r.label, r.value]),
    )
    expect(byLabel['You are sending']).toBe(
      'Unparseable amount: unreadable value',
    )
    expect(byLabel['Refund locktime']).toBe('unreadable value')
    expect(recap.blockedReason).toMatch(/^Unreadable amount/)
    expect(recap.blockedReason).toMatch(/cannot be approved/)
  })

  it('keeps a readable create request approvable', () => {
    const recap = buildBtcSignRecap({
      json: { secretHash: '{}', amount: '1000', timeoutBlocks: 500 },
      networkType,
    })

    expect(recap.blockedReason).toBeNull()
  })

  it.each([
    ['an object', {}],
    ['an array', []],
    ['null', null],
    ['a non-decimal string', '1e2'],
    ['a fraction', 4.5],
  ])(
    'reads a lock time that is %s as unreadable and blocks approval',
    (_shape, timeoutBlocks) => {
      const recap = buildBtcSignRecap({
        json: { secretHash: '{}', amount: '1000', timeoutBlocks },
        networkType,
      })

      const row = recap.rows.find((r) => r.label === 'Refund locktime')
      expect(row.value).toBe('unreadable value')
      expect(row.warn).toBe(true)
      expect(recap.blockedReason).toMatch(/^Unreadable lock time/)
    },
  )

  it('treats an unreadable claim destination as missing and blocks approval', () => {
    const recap = buildBtcSignRecap({
      json: { type: 'spendHtlc', to: { toString: 1 }, utxo: { value: 2000 } },
      networkType,
    })

    const row = recap.rows.find((r) => r.label === 'Paid to')
    expect(row.value).toBe('missing')
    expect(row.warn).toBe(true)
    expect(recap.blockedReason).toMatch(/^Unreadable destination/)
  })

  it('keeps an absent claim destination approvable (the wallet pays itself)', () => {
    const recap = buildBtcSignRecap({
      json: { type: 'spendHtlc', utxo: { value: 2000 } },
      networkType,
    })

    expect(recap.blockedReason).toBeNull()
  })

  it.each([
    ['an object shadowing toString', { toString: 1 }],
    ['an array', [{}]],
    ['null', null],
    ['a fraction', 1000.5],
    ['an exponent string', '1e3'],
  ])(
    'reads a claim amount that is %s as unknown and blocks approval',
    (_shape, value) => {
      const recap = buildBtcSignRecap({
        json: { type: 'spendHtlc', to: 'tb1qmine', utxo: { value } },
        networkType,
      })

      const row = recap.rows.find((r) => r.label === 'You are claiming')
      expect(row.value).toBe('unknown amount')
      expect(row.warn).toBe(true)
      expect(recap.blockedReason).toMatch(/^Unreadable amount/)
    },
  )

  it('reads a decimal string amount exactly like a number', () => {
    const recap = buildBtcSignRecap({
      json: { type: 'spendHtlc', to: 'tb1qmine', utxo: { value: '2000' } },
      networkType,
    })

    const row = recap.rows.find((r) => r.label === 'You are claiming')
    expect(row.value).toBe('0.00001500 BTC (500 sat fee)')
    expect(recap.blockedReason).toBeNull()
  })

  // The claim/refund amount row reads a UTXO value exactly as the signer
  // does (same predicate): anything the signer rejects is unknown and
  // blocks approval — a padded string, a lossy number, or more than
  // MAX_MONEY.
  it.each([
    ['a padded string', ' 2000 '],
    ['a lossy number', 2 ** 53],
    ['a number above MAX_MONEY', 2100000000000001],
    ['a string above MAX_MONEY', '2100000000000001'],
  ])(
    'reads a claim amount that is %s as the signer does: unusable',
    (_shape, value) => {
      expect(() => BTCTransaction.toSatoshiBigInt(value)).toThrow()

      const recap = buildBtcSignRecap({
        json: { type: 'spendHtlc', to: 'tb1qmine', utxo: { value } },
        networkType,
      })
      const row = recap.rows.find((r) => r.label === 'You are claiming')
      expect(row.value).toBe('unknown amount')
      expect(row.warn).toBe(true)
      expect(recap.blockedReason).toMatch(/^Unreadable amount/)
    },
  )

  it.each([
    ['a digit string', '2000'],
    ['a number', 2000],
    ['MAX_MONEY itself', 2100000000000000],
  ])(
    'reads a claim amount that is %s as the signer does: usable',
    (_shape, value) => {
      expect(BTCTransaction.toSatoshiBigInt(value)).toBe(BigInt(value))

      const recap = buildBtcSignRecap({
        json: { type: 'spendHtlc', to: 'tb1qmine', utxo: { value } },
        networkType,
      })
      expect(recap.blockedReason).toBeNull()
    },
  )

  // A readable amount that does not exceed the fee is shown as it is, with
  // that fact; it is not reported as unknown, and approval stays available
  // (the builders reject it deterministically).
  it.each([
    ['equal to', BTCTransaction.HTLC_CLAIM_FEE_SATOSHIS],
    ['below', BTCTransaction.HTLC_CLAIM_FEE_SATOSHIS - 100],
  ])(
    'shows a readable claim amount %s the claim fee instead of calling it unknown',
    (_relation, value) => {
      const fee = BTCTransaction.HTLC_CLAIM_FEE_SATOSHIS
      const recap = buildBtcSignRecap({
        json: { type: 'spendHtlc', to: 'tb1qmine', utxo: { value } },
        networkType,
      })

      const row = recap.rows.find((r) => r.label === 'You are claiming')
      expect(row.value).toBe(
        `${(value / SATS_PER_BTC).toFixed(8)} BTC (${value} sat) — not above the ${fee} sat claim fee`,
      )
      expect(row.warn).toBe(true)
      expect(recap.blockedReason).toBeNull()
    },
  )

  it('shows a readable refund amount that does not exceed the refund fee the same way', () => {
    const fee = BTCTransaction.HTLC_REFUND_FEE_SATOSHIS
    const value = fee
    const recap = buildBtcSignRecap({
      json: { type: 'refundHtlc', to: 'tb1qmine', utxo: { value } },
      networkType,
    })

    const row = recap.rows.find((r) => r.label === 'You are refunding')
    expect(row.value).toBe(
      `${(value / SATS_PER_BTC).toFixed(8)} BTC (${value} sat) — not above the ${fee} sat refund fee`,
    )
    expect(row.warn).toBe(true)
    expect(recap.blockedReason).toBeNull()
  })

  // The refund fee is the signer's own constant, so the row cannot drift
  // from what the builder charges.
  it('prices the refund row with the signer refund fee', () => {
    const fee = BTCTransaction.HTLC_REFUND_FEE_SATOSHIS
    const recap = buildBtcSignRecap({
      json: {
        type: 'refundHtlc',
        to: 'tb1qmine',
        utxo: { value: fee + 2000 },
      },
      networkType,
    })

    const row = recap.rows.find((r) => r.label === 'You are refunding')
    // 2000 sat above the fee: that surplus is what is refunded
    expect(row.value).toBe(`0.00002000 BTC (${fee} sat fee)`)
    expect(row.warn).toBe(false)
  })

  // The escrow address of a create request is built by the page before
  // approval. A create request whose address could not be built is blocked;
  // one whose address is still pending or was built is not.
  it('blocks a create request whose escrow address could not be built', () => {
    const recap = buildBtcSignRecap({
      json: { secretHash: '{}', amount: '1000', timeoutBlocks: 500 },
      networkType,
      escrowFailed: true,
    })

    expect(recap.blockedReason).toMatch(/^Escrow address unavailable/)
    expect(recap.blockedReason).toMatch(/cannot be approved/)
    // an unreadable amount is named first
    expect(
      buildBtcSignRecap({
        json: { secretHash: '{}', amount: { toString: 1 }, timeoutBlocks: 500 },
        networkType,
        escrowFailed: true,
      }).blockedReason,
    ).toMatch(/^Unreadable amount/)
  })

  it('keeps a create request approvable while its escrow address is pending or built', () => {
    const json = { secretHash: '{}', amount: '1000', timeoutBlocks: 500 }
    expect(buildBtcSignRecap({ json, networkType }).blockedReason).toBeNull()
    expect(
      buildBtcSignRecap({
        json,
        networkType,
        escrowFeeInfo: { htlc: { p2wshAddress: 'tb1qescrow' } },
      }).blockedReason,
    ).toBeNull()
  })

  it('summarizes an HTLC refund', () => {
    const recap = buildBtcSignRecap({
      json: {
        type: 'refundHtlc',
        to: 'tb1qmine',
        utxo: { txid: 'f'.repeat(64), vout: 0, value: 3000 },
      },
      networkType,
    })

    expect(recap.title).toBe('Refund HTLC')
    const byLabel = Object.fromEntries(
      recap.rows.map((r) => [r.label, r.value]),
    )
    expect(byLabel['You are refunding']).toBe('0.00002000 BTC (1000 sat fee)')
  })
})
