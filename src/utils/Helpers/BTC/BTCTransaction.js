import { BTC } from '@Helpers'

const SIZE_CONSTANTS = {
  overhead: 10,
  input: 148,
  output: 34,
}

const getInputsAmount = ({ addressFrom, amountToTranfer }) => {
  // TODO: implement function
  console.log(addressFrom, amountToTranfer)
  return 2
}

const getOuputsAmount = ({ usedUtxos, amountToTranfer }) => {
  // TODO: implement function
  console.log(usedUtxos, amountToTranfer)
  return 2
}

const calculateTransactionSizeInBytes = ({ addressFrom, amountToTranfer }) => {
  const inputsSize = SIZE_CONSTANTS.input * getInputsAmount({})
  const ouputsSize = SIZE_CONSTANTS.output * getOuputsAmount({})

  return SIZE_CONSTANTS.overhead + inputsSize + ouputsSize
}

const isValidAmount = (amount) => amount && amount < BTC.MAX_BTC_IN_SATOSHIS

const orderByDateDesc = (transactionA, transactionB) => {
  if (transactionA.status.block_time > transactionB.status.block_time) return -1
  if (transactionA.status.block_time < transactionB.status.block_time) return 1
  return 0
}

const getEnoughUtxo = (transactions, target) =>
  transactions.reduce((acc, item) => {
    if (target < 0) return acc
    target = target - item.value
    acc.push(item)
    return acc
  }, [])

const utxoSelect = (utxoList, amountNeeded) => {
  if (BTC.calculateBalanceFromUtxoList(utxoList) < amountNeeded)
    throw Error('Not enough funds')

  /*
   * The "coin selection" algo used here is LIFO.
   * Hence, the list is first ordered from newer to older
   * then we get all transactions needed, from the first,
   * to cover the desired amount.
   */
  const newerToOlder = utxoList.sort(orderByDateDesc)
  const selectedTransactions = getEnoughUtxo(newerToOlder, amountNeeded)

  return selectedTransactions
}

const isTransactionSegwit = (transaction) =>
  transaction.vin.some((vin) => vin.witness && vin.witness.length)

const nonSegwitFilter = (transaction) => !isTransactionSegwit(transaction)

export {
  utxoSelect,
  calculateTransactionSizeInBytes,
  nonSegwitFilter,
  isTransactionSegwit,
  isValidAmount,
}
