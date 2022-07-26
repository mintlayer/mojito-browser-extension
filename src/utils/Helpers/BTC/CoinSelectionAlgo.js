import { BTC } from '@Helpers'

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

export { utxoSelect }
