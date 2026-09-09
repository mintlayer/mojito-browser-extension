import { adaptDesignTx, resolveTxSymbol } from './Transactions'

const TOKEN_ID =
  '00000000abc123def4567890abcdef1234567890abcdef1234567890abcdef12'

describe('resolveTxSymbol', () => {
  test('returns ML for a coin transaction (no token_id)', () => {
    const tx = { direction: 'in', value: 1.5 }

    expect(resolveTxSymbol(tx)).toBe('ML')
  })

  test('returns ML when token_id is explicitly undefined', () => {
    expect(resolveTxSymbol({ token_id: undefined })).toBe('ML')
  })

  test('returns the token ticker from tokenBalances when token_ticker is an object', () => {
    const tokenBalances = {
      [TOKEN_ID]: { token_info: { token_ticker: { string: 'mlUSDC' } } },
    }

    expect(resolveTxSymbol({ token_id: TOKEN_ID }, tokenBalances)).toBe(
      'mlUSDC',
    )
  })

  test('returns the token ticker from tokenBalances when token_ticker is a flat string', () => {
    const tokenBalances = {
      [TOKEN_ID]: { token_info: { token_ticker: 'mlUSDC' } },
    }

    expect(resolveTxSymbol({ token_id: TOKEN_ID }, tokenBalances)).toBe(
      'mlUSDC',
    )
  })

  test('falls back to the whole-network tokenMap when there is no balances entry', () => {
    const tokenMap = { [TOKEN_ID]: 'mlUSDC' }

    expect(resolveTxSymbol({ token_id: TOKEN_ID }, {}, tokenMap)).toBe('mlUSDC')
  })

  test('returns the neutral fallback Token when the ticker is in neither source', () => {
    const tx = { token_id: TOKEN_ID }

    expect(resolveTxSymbol(tx)).toBe('Token')
    expect(resolveTxSymbol(tx, {})).toBe('Token')
    expect(resolveTxSymbol(tx, {}, {})).toBe('Token')
  })

  test('prefers the balances ticker over the tokenMap ticker', () => {
    const tokenBalances = {
      [TOKEN_ID]: { token_info: { token_ticker: { string: 'mlUSDC' } } },
    }
    const tokenMap = { [TOKEN_ID]: 'mlUSDC-OTHER' }

    expect(
      resolveTxSymbol({ token_id: TOKEN_ID }, tokenBalances, tokenMap),
    ).toBe('mlUSDC')
  })

  test('tolerates a missing transaction object', () => {
    expect(resolveTxSymbol()).toBe('ML')
  })
})

describe('adaptDesignTx', () => {
  test('maps an incoming transaction to type receive and passes sym/chain through', () => {
    const tx = {
      direction: 'in',
      value: 1.5,
      date: 1700000000,
      txid: 'abc123',
      otherPart: 'recipient-address',
    }

    const result = adaptDesignTx(tx, 'ML', 'mainnet')

    expect(result.type).toBe('receive')
    expect(result.sym).toBe('ML')
    expect(result.chain).toBe('mainnet')
    expect(result.status).toBe('Confirmed')
    expect(result.when).not.toBe('Pending')
  })

  test('maps an outgoing transaction to type send', () => {
    const tx = { direction: 'out', value: 2, date: 1700000000 }

    expect(adaptDesignTx(tx, 'ML', 'mainnet').type).toBe('send')
  })

  test('formats a BTC amount through the BTC formatter', () => {
    const tx = { direction: 'out', value: 2, date: 1700000000 }

    expect(adaptDesignTx(tx, 'BTC', 'bitcoin').amount).toBe('2')
  })

  test('maps order transactions to type swap with a null amount', () => {
    const tx = {
      type: 'CreateOrder',
      direction: 'out',
      // Order txs carry structured payloads, not a simple numeric value
      value: { order: { ask: { coin: { amount: '1' } } } },
      date: 1700000000,
    }

    const result = adaptDesignTx(tx, 'ML', 'mainnet')

    expect(result.type).toBe('swap')
    expect(result.amount).toBeNull()
  })

  test('maps FillOrder to type swap as well', () => {
    const tx = { type: 'FillOrder', direction: 'out', date: 1700000000 }

    expect(adaptDesignTx(tx, 'ML', 'mainnet').type).toBe('swap')
  })

  test('maps staking delegations to type dapp with a null amount', () => {
    const tx = {
      type: 'DelegateStaking',
      direction: 'out',
      // Delegation txs expose `amount`, not a simple numeric `value`
      amount: 100,
      date: 1700000000,
    }

    const result = adaptDesignTx(tx, 'ML', 'mainnet')

    expect(result.type).toBe('dapp')
    expect(result.amount).toBeNull()
  })

  test('renders pending transactions with Pending when/status', () => {
    const tx = { direction: 'out', value: 1 }

    const result = adaptDesignTx(tx, 'ML', 'mainnet')

    expect(result.when).toBe('Pending')
    expect(result.status).toBe('Pending')
  })

  test('copies txid and counterpart address into hash/to/from', () => {
    const tx = {
      direction: 'out',
      value: 1,
      date: 1700000000,
      txid: 'hash-xyz',
      otherPart: 'counterpart-address',
    }

    const result = adaptDesignTx(tx, 'ML', 'mainnet')

    expect(result.hash).toBe('hash-xyz')
    expect(result.to).toBe('counterpart-address')
    expect(result.from).toBe('counterpart-address')
  })
})
