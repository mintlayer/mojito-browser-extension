import { BTC, BTCTransaction } from '@Helpers'

const orderByDateDesc = (transactionA, transactionB) => {
  if (transactionA.status.block_time > transactionB.status.block_time) return -1
  if (transactionA.status.block_time < transactionB.status.block_time) return 1
  return 0
}

const getEnoughUtxo = (transactions, amount, fee) => {
  let target = amount
  let feeNeeded = 0
  return transactions.reduce((acc, item) => {
    if (item.value === 0) return acc
    feeNeeded =
      (BTCTransaction.SIZE_CONSTANTS.overhead +
        BTCTransaction.SIZE_CONSTANTS.output *
          BTCTransaction.OUTPUT_AMOUNT_DEFAULT +
        BTCTransaction.SIZE_CONSTANTS.input * (acc.length + 1)) *
      fee

    if (target + feeNeeded <= 0) return acc
    target = target - item.value
    acc.push(item)
    return acc
  }, [])
}

const utxoSelect = (utxoList, amountNeeded, fee) => {
  if (BTC.calculateBalanceFromUtxoList(utxoList) < amountNeeded)
    throw Error('Not enough funds')

  /*
   * The "coin selection" algo used here is LIFO.
   * Hence, the list is first ordered from newer to older
   * then we get all transactions needed, from the first,
   * to cover the desired amount.
   */
  const newerToOlder = utxoList.sort(orderByDateDesc)
  const selectedTransactions = getEnoughUtxo(newerToOlder, amountNeeded, fee)
  return selectedTransactions
}

export { utxoSelect }
