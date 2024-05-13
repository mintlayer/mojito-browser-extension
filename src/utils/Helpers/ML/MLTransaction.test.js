import {
  getUtxoBalance,
  getUtxoTransaction,
  getUtxoTransactionsBytes,
  // getOutpointedSourceId,
} from './MLTransaction'

const UTXSOS_MOCK = [
  {
    outpoint: {
      source_id:
        '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      source_type: 'Transaction',
      input_type: 'UTXO',
      index: 0,
    },
    utxo: {
      destination: 'tmt1qylgafccyyy26zrtqk8gjvcwzut26taruuyzmcr6',
      type: 'Transfer',
      value: {
        amount: {
          atoms: '200',
          decimals: '0.000000002',
        },
        type: 'Coin',
      },
    },
  }
]

describe('getUtxoBalance', () => {
  it('should return the sum of the utxo values', () => {
    const result = getUtxoBalance(UTXSOS_MOCK[0]) // in fact this function just for single utxo
    expect(result.toString()).toBe('200')
  })
})

describe('getUtxoTransaction', () => {
  it('should return the transaction id and index', () => {
    const item = getUtxoTransaction(UTXSOS_MOCK[0]) // in fact this function just for single item

    expect(item.transaction).toEqual(
      UTXSOS_MOCK[0].outpoint.source_id,
    )
    expect(item.index).toEqual(UTXSOS_MOCK[0].outpoint.index)
  })
})

describe('getUtxoTransactionsBytes', () => {
  it('should return the transaction bytes and index', () => {
    const getUtxoTransactionResult = getUtxoTransaction(UTXSOS_MOCK[0]) // in fact this function just for single item
    const item = getUtxoTransactionsBytes(getUtxoTransactionResult)

    expect(item.bytes).toEqual(
      Buffer.from(getUtxoTransactionResult.transaction, 'hex'),
    )
    expect(item.index).toEqual(getUtxoTransactionResult.index)
  })
})
