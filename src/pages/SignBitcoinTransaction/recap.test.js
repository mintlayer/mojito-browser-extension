import { parseSatoshiAmount, buildBtcSignRecap } from './recap'

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

  it('returns null for unknown/empty request shapes', () => {
    expect(buildBtcSignRecap({ json: null, networkType })).toBeNull()
    expect(
      buildBtcSignRecap({ json: { type: 'transfer' }, networkType }),
    ).toBeNull()
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
