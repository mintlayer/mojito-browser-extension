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

  it('never raises two flags for the same transaction', () => {
    Object.entries(MOCKS).forEach(([name, mock]) => {
      const { flags } = getTransactionDetails(mock)
      const raised = Object.keys(flags).filter((flag) => flags[flag])

      expect([name, raised]).toEqual([name, [expect.any(String)]])
    })
  })
})
