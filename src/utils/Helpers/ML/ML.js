import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'

const getAmountInCoins = (amointInAtoms, exchangeRate) => {
  return amointInAtoms / exchangeRate
}

const getParsedTransactions = (transactions) => {
  const filteredTransactions = ArrayHelper.removeDublicates(transactions)
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => b.timestamp - a.timestamp,
  )
  const transactionsIds = sortedTransactions.map(
    (transaction) => transaction.txid,
  )

  return sortedTransactions.map((transaction) => {
    const isInputMine = transaction.inputs.some((input) =>
      transactionsIds.includes(input.Utxo.id.Transaction),
    )

    const direction = isInputMine ? 'out' : 'in'
    const destAddress = transaction.outputs[1].destination
    const value = getAmountInCoins(
      transaction.outputs[0].value.amount,
      AppInfo.ML_ATOMS_PER_COIN,
    )
    const confirmations = transaction.confirmations
    const date = transaction.timestamp
    const txid = transaction.txid
    const fee = transaction.fee
    const isConfirmed = confirmations > 0

    return {
      direction,
      destAddress,
      value,
      confirmations,
      date,
      txid,
      fee,
      isConfirmed,
    }
  })
}

export { getParsedTransactions }
