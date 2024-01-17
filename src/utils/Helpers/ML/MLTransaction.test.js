import {
  getUtxoBalance,
  getUtxoTransaction,
  getUtxoTransactionsBytes,
  // getOutpointedSourceId,
} from './MLTransaction'

const UTXSOS_MOCK = [
  {
    outpoint: {
      id: {
        Transaction:
          '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      },
      index: 1,
    },
    utxo: {
      destination: 'tmt1qylgafccyyy26zrtqk8gjvcwzut26taruuyzmcr6',
      type: 'Transfer',
      value: {
        amount: '200',
        type: 'Coin',
      },
    },
  },
  {
    outpoint: {
      id: {
        Transaction:
          '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      },
      index: 1,
    },
    utxo: {
      destination: 'tmt1qylgafccyyy26zrtqk8gjvcwzut26taruuyzmcr6',
      type: 'Transfer',
      value: {
        amount: '200',
        type: 'Coin',
      },
    },
  },
  {
    outpoint: {
      id: {
        Transaction:
          '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      },
      index: 1,
    },
    utxo: {
      destination: 'tmt1qylgafccyyy26zrtqk8gjvcwzut26taruuyzmcr6',
      type: 'Transfer',
      value: {
        amount: '200',
        type: 'Coin',
      },
    },
  },
]

describe('getUtxoBalance', () => {
  it('should return the sum of the utxo values', () => {
    const result = getUtxoBalance(UTXSOS_MOCK)
    expect(result).toBe(600)
  })
})

describe('getUtxoTransaction', () => {
  it('should return the transaction id and index', () => {
    const result = getUtxoTransaction(UTXSOS_MOCK)

    result.forEach((item, index) => {
      expect(item.transaction).toEqual(
        UTXSOS_MOCK[index].outpoint.id.Transaction,
      )
      expect(item.index).toEqual(UTXSOS_MOCK[index].outpoint.index)
    })
  })
})

describe('getUtxoTransactionsBytes', () => {
  it('should return the transaction bytes and index', () => {
    const getUtxoTransactionResult = getUtxoTransaction(UTXSOS_MOCK)
    const result = getUtxoTransactionsBytes(getUtxoTransactionResult)

    result.forEach((item, index) => {
      expect(item.bytes).toEqual(
        Buffer.from(getUtxoTransactionResult[index].transaction, 'hex'),
      )
      expect(item.index).toEqual(getUtxoTransactionResult[index].index)
    })
  })
})
