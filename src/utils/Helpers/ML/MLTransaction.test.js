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
  },
  {
    outpoint: {
      source_id:
        '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      source_type: 'Transaction',
      input_type: 'UTXO',
      index: 1,
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
  },
  {
    outpoint: {
      source_id:
        '0cd5de5319de96f7c967a24a51224f4eab7882e6dbe336ab6837b15e1b68dace',
      source_type: 'Transaction',
      input_type: 'UTXO',
      index: 2,
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
  },
]

describe('getUtxoBalance', () => {
  it('should return the sum of the utxo values', () => {
    const result = getUtxoBalance(UTXSOS_MOCK)
    expect(result.toString()).toBe('600')
  })
})

describe('getUtxoTransaction', () => {
  it('should return the transaction id and index', () => {
    const result = getUtxoTransaction(UTXSOS_MOCK)

    result.forEach((item, index) => {
      expect(item.transaction).toEqual(
        UTXSOS_MOCK[index].outpoint.source_id,
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
