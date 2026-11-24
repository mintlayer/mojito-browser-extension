import { BTCTransaction } from '@Cryptos'
import {
  BTC_REQUEST_KIND,
  parseSatoshiAmount,
  buildBtcSignRecap,
  classifyBtcSignRequest,
} from './recap'
import { MOCKS, CREATE_HTLC_FIXTURE_KEYS } from './mocks'

// The test wallet's Bitcoin public keys, in the stored shape: the
// createHtlc fixture's refund key is its receiving key. A create recap is
// built from the page's verdict on the two keys, which the real verifier
// computes from these keys.
const WALLET_BTC_KEYS = {
  btcReceivingAddresses: [
    {
      tb1qwalletreceiving: { pubkey: CREATE_HTLC_FIXTURE_KEYS.refundPublicKey },
    },
  ],
  btcChangeAddresses: [],
}
const keysVerdict = (json, btcAddressData = WALLET_BTC_KEYS) =>
  BTCTransaction.verifyHtlcCreateKeys({
    refundPublicKey: json.refundPublicKey,
    recipientPublicKey: json.recipientPublicKey,
    btcAddressData,
  })
// A valid public key that is not one of the test wallet's, and a
// well-formed 33-byte value whose x is not on the secp256k1 curve.
const FOREIGN_PUBKEY =
  '027b87bd06d549c49e3809adacefc62ea8beec177c32aeffaf5c00ac04ffd00749'
const NOT_ON_CURVE_PUBKEY =
  '020000000000000000000000000000000000000000000000000000000000000005'
// A valid point as an uncompressed key (65 bytes starting 04): the
// secp256k1 generator point.
const UNCOMPRESSED_PUBKEY =
  '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8'
// A well-formed create request for the test wallet, with the fields
// overridden per test.
const createJson = (overrides = {}) => ({
  secretHash: '{"secret_hash_hex":"ab"}',
  amount: '1000',
  timeoutBlocks: 500,
  ...CREATE_HTLC_FIXTURE_KEYS,
  ...overrides,
})

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

  // The two keys of a well-formed create request: the refund key is one of
  // the wallet's own and the recipient key is not, each shown truncated
  // and named as such, monospaced.
  it('summarizes an HTLC create request with escrow, amount, fee and both keys', () => {
    const json = createJson({ amount: '20000' })
    const recap = buildBtcSignRecap({
      json,
      networkType,
      escrowFeeInfo: {
        htlc: { p2wshAddress: 'tb1qescrow' },
        feeRate: 10,
        estimatedFee: 1540,
      },
      createKeys: keysVerdict(json),
    })

    expect(recap.title).toBe('Create HTLC — fund an escrow')
    expect(recap.blockedReason).toBeNull()
    const rows = Object.fromEntries(recap.rows.map((r) => [r.label, r]))
    expect(rows['You are sending'].value).toBe('0.00020000 BTC (20000 sat)')
    expect(rows['Escrow address'].value).toBe('tb1qescrow')
    expect(rows['Fee (estimate)'].value).toBe('1540 sat @ 10 sat/vB')
    expect(rows['Refund locktime'].value).toBe('500 blocks')
    const refund = CREATE_HTLC_FIXTURE_KEYS.refundPublicKey
    const recipient = CREATE_HTLC_FIXTURE_KEYS.recipientPublicKey
    expect(rows['Refund key']).toEqual({
      label: 'Refund key',
      value: `${refund.slice(0, 12)}…${refund.slice(-8)} — a key of this wallet`,
      mono: true,
      warn: false,
    })
    expect(rows['Recipient key']).toEqual({
      label: 'Recipient key',
      value: `${recipient.slice(0, 12)}…${recipient.slice(-8)} — not a key of this wallet`,
      mono: true,
      warn: false,
    })
    expect(recap.rows.map((r) => r.label)).toEqual([
      'You are sending',
      'Escrow address',
      'Fee (estimate)',
      'Refund locktime',
      'Refund key',
      'Recipient key',
      'Network',
    ])
    expect(recap.warning).toBeTruthy()
  })

  it('flags an unparseable create amount instead of showing a wrong number', () => {
    const json = { secretHash: '{}', amount: '1.9' }
    const recap = buildBtcSignRecap({
      json,
      networkType,
      createKeys: keysVerdict(json),
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
    const json = { secretHash: '{}', amount: shadow, timeoutBlocks: shadow }
    const recap = buildBtcSignRecap({
      json,
      networkType,
      createKeys: keysVerdict(json),
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

  it('keeps a readable create request with verified keys approvable', () => {
    const json = createJson({ secretHash: '{}' })
    const recap = buildBtcSignRecap({
      json,
      networkType,
      createKeys: keysVerdict(json),
    })

    expect(recap.blockedReason).toBeNull()
  })

  // The refund branch of the escrow pays one single key. A refund key that
  // is a valid key but not one of the wallet's own leaves the user with no
  // key that can recover the funds after the lock time, so the recap says
  // so in plain words, flags the key and blocks approval.
  it('blocks a create request whose refund key is not a key of the wallet, and says why', () => {
    const json = createJson({
      refundPublicKey: FOREIGN_PUBKEY,
      recipientPublicKey: CREATE_HTLC_FIXTURE_KEYS.recipientPublicKey,
    })
    const recap = buildBtcSignRecap({
      json,
      networkType,
      escrowFeeInfo: { htlc: { p2wshAddress: 'tb1qescrow' } },
      createKeys: keysVerdict(json),
    })

    expect(recap.blockedReason).toBe(
      'Refund key: not a key of this wallet. After the lock time, only the holder of that key could recover these funds. For your safety, this request cannot be approved.',
    )
    const refund = recap.rows.find((r) => r.label === 'Refund key')
    expect(refund.value).toBe(
      `${FOREIGN_PUBKEY.slice(0, 12)}…${FOREIGN_PUBKEY.slice(-8)} — not a key of this wallet`,
    )
    expect(refund.warn).toBe(true)
    expect(refund.mono).toBe(true)
  })

  // A key that is not a valid public key makes its branch of the escrow
  // unspendable (a truncated or non-hex value would otherwise be cut down
  // to a prefix by the hex decode). The recap names the key and why.
  it.each([
    [
      'an odd-length refund key',
      { refundPublicKey: '02abc' },
      /^Refund key: not a valid public key — its hex has an odd number of digits/,
    ],
    [
      'a non-hex recipient key',
      { recipientPublicKey: '02zz' },
      /^Recipient key: not a valid public key — it contains characters that are not hex digits/,
    ],
    [
      'a refund key that is not text',
      { refundPublicKey: { toString: 1 } },
      /^Refund key: not a valid public key — it is not text/,
    ],
    [
      'a recipient key that is not on the curve',
      { recipientPublicKey: NOT_ON_CURVE_PUBKEY },
      /^Recipient key: not a valid public key — it is not a point on the secp256k1 curve/,
    ],
    // a valid point no escrow script can carry: the address builder
    // rejects a script holding an uncompressed key
    [
      'an uncompressed refund key',
      { refundPublicKey: UNCOMPRESSED_PUBKEY },
      /^Refund key: not a valid public key — it is an uncompressed key, and the escrow script carries compressed keys only\. The escrow's refund branch could never be spent/,
    ],
    [
      'an uncompressed recipient key',
      { recipientPublicKey: UNCOMPRESSED_PUBKEY },
      /^Recipient key: not a valid public key — it is an uncompressed key, and the escrow script carries compressed keys only/,
    ],
  ])(
    'blocks a create request with %s, naming the key and why',
    (_shape, overrides, reason) => {
      const json = createJson(overrides)
      const recap = buildBtcSignRecap({
        json,
        networkType,
        createKeys: keysVerdict(json),
      })

      expect(recap.blockedReason).toMatch(reason)
      expect(recap.blockedReason).toMatch(/cannot be approved/)
      expect(recap.blockedReason).not.toMatch(
        /Refund key: not a key of this wallet/,
      )
    },
  )

  // Fail closed: without the wallet's own public keys the refund key cannot
  // be checked, and without a verdict nothing is verified. A key that could
  // not be checked is never called the wallet's or a foreign one: the row
  // says it could not be checked, and the reason does not presume the
  // outcome either.
  it("blocks a create request when the wallet's public keys cannot be read", () => {
    const json = createJson()
    const recap = buildBtcSignRecap({
      json,
      networkType,
      createKeys: keysVerdict(json, { btcReceivingAddresses: [] }),
    })

    expect(recap.blockedReason).toBe(
      'The public keys of this wallet could not be read, so the refund key cannot be checked against them. If it is not a key of this wallet, after the lock time only the holder of that key could recover these funds. For your safety, this request cannot be approved.',
    )
    const refund = CREATE_HTLC_FIXTURE_KEYS.refundPublicKey
    const recipient = CREATE_HTLC_FIXTURE_KEYS.recipientPublicKey
    const rows = Object.fromEntries(recap.rows.map((r) => [r.label, r]))
    expect(rows['Refund key']).toEqual({
      label: 'Refund key',
      value: `${refund.slice(0, 12)}…${refund.slice(-8)} — could not be checked against the keys of this wallet`,
      mono: true,
      warn: true,
    })
    expect(rows['Recipient key']).toEqual({
      label: 'Recipient key',
      value: `${recipient.slice(0, 12)}…${recipient.slice(-8)} — could not be checked against the keys of this wallet`,
      mono: true,
      warn: false,
    })
    // neither key is called the wallet's or a foreign one
    expect(recap.rows.map((r) => r.value).join(' ')).not.toMatch(
      /not a key of this wallet|a key of this wallet/,
    )
  })

  it('blocks a create request whose keys were not verified', () => {
    const recap = buildBtcSignRecap({ json: createJson(), networkType })

    expect(recap.blockedReason).toBe(
      'The keys of this request were not verified, so the refund key cannot be confirmed as a key of this wallet. For your safety, this request cannot be approved.',
    )
    expect(recap.rows.find((r) => r.label === 'Refund key').value).toMatch(
      /^not a valid public key — it was not verified/,
    )
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
    const json = createJson({ secretHash: '{}' })
    const createKeys = keysVerdict(json)
    const recap = buildBtcSignRecap({
      json,
      networkType,
      escrowFailed: true,
      createKeys,
    })

    expect(recap.blockedReason).toMatch(/^Escrow address unavailable/)
    expect(recap.blockedReason).toMatch(/cannot be approved/)
    // an unreadable amount is named first, then the keys
    expect(
      buildBtcSignRecap({
        json: { ...json, amount: { toString: 1 } },
        networkType,
        escrowFailed: true,
        createKeys,
      }).blockedReason,
    ).toMatch(/^Unreadable amount/)
    expect(
      buildBtcSignRecap({
        json: { ...json, refundPublicKey: FOREIGN_PUBKEY },
        networkType,
        escrowFailed: true,
        createKeys: keysVerdict({ ...json, refundPublicKey: FOREIGN_PUBKEY }),
      }).blockedReason,
    ).toMatch(/^Refund key: not a key of this wallet/)
  })

  it('keeps a create request approvable while its escrow address is pending or built', () => {
    const json = createJson({ secretHash: '{}' })
    const createKeys = keysVerdict(json)
    expect(
      buildBtcSignRecap({ json, networkType, createKeys }).blockedReason,
    ).toBeNull()
    expect(
      buildBtcSignRecap({
        json,
        networkType,
        escrowFeeInfo: { htlc: { p2wshAddress: 'tb1qescrow' } },
        createKeys,
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
