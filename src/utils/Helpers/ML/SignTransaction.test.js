import { getTransactionDetails, getTransactionType } from './SignTransaction'
import { MOCKS } from '../../../pages/SignExternalTransaction/mocks'

const typeOf = (name) => {
  const { txData } = MOCKS[name].request.data
  return getTransactionType(txData.JSONRepresentation, txData.intent)
}

describe('getTransactionType', () => {
  it.each([
    ['transfer', 'isTransfer'],
    ['transfer_token', 'isTransfer'],
    ['transferNft', 'isTransfer'],
    ['tokens_mint', 'isTokenMint'],
    ['tokensunmint', 'isTokenUnmint'],
    ['tokensmint_with_lock', 'isTokenMintWithLock'],
    ['issuetoken', 'isIssueToken'],
    ['issueNft', 'isIssueNft'],
    ['createorder', 'isCreateOrder'],
    ['fillorder', 'isFillOrder'],
    ['concludeorder', 'isConcludeOrder'],
    ['burnToken', 'isBurnToken'],
    ['lockTokenSupply', 'isLockTokenSupply'],
    ['changeTokenAuthority', 'isChangeTokenAuthority'],
    ['changeTokenMetadata', 'isChangeTokenMetadata'],
    ['freezeToken', 'isFreezeToken'],
    ['unfreezeToken', 'isUnfreezeToken'],
    ['dataDeposit', 'isDataDeposit'],
    ['delegationCreateId', 'isCreateDelegationId'],
    ['delegationStake', 'isDelegateStaking'],
    ['delegationWithdraw', 'isDelegateWithdraw'],
    ['createHtlc', 'isCreateHtlc'],
    ['refundHtlc', 'isSpendHtlc'],
  ])('reads %s as %s', (mock, expected) => {
    expect(typeOf(mock)).toBe(expected)
  })

  it('ignores injected account commands on UTXO inputs', () => {
    // commands are read only on account-command inputs — a UTXO input with
    // an injected MintTokens command encodes a plain transfer
    expect(
      getTransactionType({
        inputs: [
          {
            input: {
              input_type: 'UTXO',
              command: 'MintTokens',
              token_id: 'cheap',
              amount: { atoms: '1' },
            },
            utxo: {
              type: 'Transfer',
              destination: 'x',
              value: { type: 'Coin', amount: { atoms: '1' } },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: 'y',
            value: { type: 'Coin', amount: { atoms: '1' } },
          },
        ],
      }),
    ).toBe('isTransfer')
  })

  it('does not flag a hybrid UTXO DelegationBalance input as a withdrawal', () => {
    // the withdrawal flag mirrors the signer's inputCommands filter: only
    // AccountCommand/Account inputs can be withdrawals — a UTXO input with
    // an injected account_type encodes a plain utxo leg
    expect(
      getTransactionType({
        inputs: [
          {
            input: {
              input_type: 'UTXO',
              account_type: 'DelegationBalance',
              amount: { atoms: '0' },
            },
            utxo: {
              type: 'Transfer',
              destination: 'x',
              value: { type: 'Coin', amount: { atoms: '1' } },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: 'y',
            value: { type: 'Coin', amount: { atoms: '1' } },
          },
        ],
      }),
    ).toBe('isTransfer')
  })

  it('does not flip to an HTLC spend for a utxo injected on an account input', () => {
    // the signer reads utxo legs (and their htlc witnesses) only for
    // input_type 'UTXO' — an account command with an injected Htlc-shaped
    // utxo (consistent atoms/decimal included) encodes the command alone
    expect(
      getTransactionType({
        inputs: [
          {
            input: {
              input_type: 'AccountCommand',
              command: 'ConcludeOrder',
              order_id: 'o1',
              nonce: '0',
            },
            utxo: {
              type: 'Htlc',
              value: {
                type: 'Coin',
                amount: { atoms: '1000000000000', decimal: '10' },
              },
              htlc: {
                secret_hash: { hex: 'aa' },
                spend_key: 'tmt1qspend',
                refund_key: 'tmt1qrefund',
              },
            },
          },
        ],
        outputs: [],
      }),
    ).toBe('isConcludeOrder')
  })

  it('flags coin-vs-token burns by token-id presence', () => {
    // a self-contradictory {type: 'Coin', token_id} signs a TOKEN burn
    expect(
      getTransactionType({
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: { type: 'Coin', token_id: 't', amount: { atoms: '1' } },
          },
        ],
      }),
    ).toBe('isBurnToken')
    // a coin burn (no token_id) flags isBurnCoin
    expect(
      getTransactionType({
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: { type: 'Coin', amount: { atoms: '1' } },
          },
        ],
      }),
    ).toBe('isBurnCoin')
  })

  it('reports an unknown operation instead of guessing a transfer', () => {
    expect(
      getTransactionType({
        inputs: [{ input: { input_type: 'UTXO' } }],
        outputs: [{ type: 'SomethingNewFromTheChain' }],
      }),
    ).toBe('isUnknown')
  })

  it('reports an unknown operation when there are no outputs', () => {
    expect(getTransactionType({ inputs: [], outputs: [] })).toBe('isUnknown')
  })

  it('never throws on leg entries that are not objects', () => {
    // entries are dApp-controlled too — null, undefined or primitive entries
    // in either leg degrade to 'unknown operation' instead of crashing the
    // approval render
    expect(
      getTransactionType({
        inputs: [null, undefined, 'UTXO', 42],
        outputs: [null, undefined, 'Transfer', 42],
      }),
    ).toBe('isUnknown')
  })

  it('reads only string types and commands, and only own flag-table keys', () => {
    // an object type/command never names an operation — it must select
    // nothing and never throw (one carrying its own `toString`/`valueOf`
    // would even throw when coerced to a property key); nor must an
    // inherited member name such as 'toString' or 'constructor' select an
    // operation
    expect(
      getTransactionType({
        inputs: [
          { input: { input_type: 'AccountCommand', command: { toString: 1 } } },
        ],
        outputs: [{ type: { toString: 1 } }],
      }),
    ).toBe('isUnknown')
    expect(
      getTransactionType({
        inputs: [
          {
            input: { input_type: 'AccountCommand', command: 'constructor' },
          },
        ],
        outputs: [{ type: 'toString' }, { type: 'toLocaleString' }],
      }),
    ).toBe('isUnknown')
  })

  it('names a bridge request only for a string intent', () => {
    expect(getTransactionType({ inputs: [], outputs: [] }, 'deadbeef')).toBe(
      'isBridgeRequest',
    )
    // anything else present is malformed (blocked upstream) and names no
    // operation
    expect(
      getTransactionType({ inputs: [], outputs: [] }, { toString: 1 }),
    ).toBe('isUnknown')
    expect(getTransactionType({ inputs: [], outputs: [] }, 42)).toBe(
      'isUnknown',
    )
  })

  it('never raises two flags for the same transaction', () => {
    Object.entries(MOCKS).forEach(([name, mock]) => {
      const { flags } = getTransactionDetails(mock)
      const raised = Object.keys(flags).filter((flag) => flags[flag])

      expect([name, raised]).toEqual([name, [expect.any(String)]])
    })
  })
})
