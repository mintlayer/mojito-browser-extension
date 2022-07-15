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

const buildTransaction = ({ to, amount, fee, wif }) => {
  const transaction = { to, amount, fee, wif }
  // get uTxos ✅
  // select needed uTxos (LIFO) needed to cover `amount + fee` ✅
  // request raw transaction hex from non-SegWit selected uTxos ✅

  // calculate `change` as the `sum of selected uTxos - fee - amount`
  // use selected transactions as transaction input[]
  // if SegWit transaction, use whole raw transaction
  // if non-SegWit, use just vout scriptPubKey
  // set first output to `to` with value `amount`
  // set second output to the btc addr in the app AccountContext with value of `change`
  // sign input with WIF
  return transaction
}

export { utxoSelect, buildTransaction }
