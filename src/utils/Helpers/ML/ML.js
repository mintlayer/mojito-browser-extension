import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'
import { LocalStorageService } from '@Storage'

const getAmountInCoins = (amointInAtoms) => {
  return amointInAtoms / AppInfo.ML_ATOMS_PER_COIN
}

const getAmountInAtoms = (amountInCoins) => {
  return Math.round(amountInCoins * AppInfo.ML_ATOMS_PER_COIN)
}

const getParsedTransactions = (transactions, addresses) => {
  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}`
  const unconfirmedTransactions = LocalStorageService.getItem(
    unconfirmedTransactionString,
  )
  const filteredTransactions = ArrayHelper.removeDublicates(transactions)
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => b.timestamp - a.timestamp,
  )

  const isUncofermedTransactionInList =
    unconfirmedTransactions &&
    sortedTransactions.some(
      (transaction) => transaction.txid === unconfirmedTransactions.txid,
    )

  if (unconfirmedTransactions && isUncofermedTransactionInList) {
    LocalStorageService.removeItem(unconfirmedTransactionString)
  }

  if (unconfirmedTransactions && !isUncofermedTransactionInList) {
    sortedTransactions.unshift(unconfirmedTransactions)
  }

  return sortedTransactions.map((transaction) => {
    if (!transaction.outputs)
      return {
        direction: transaction.direction,
        destAddress: transaction.destAddress,
        value: transaction.value,
        confirmations: transaction.confirmations,
        date: transaction.date,
        txid: transaction.txid,
        fee: transaction.fee,
        isConfirmed: transaction.isConfirmed,
      }

    const isOutputMine = addresses.some(
      (address) => transaction.outputs[0].destination === address,
    )

    const direction = !isOutputMine ? 'out' : 'in'
    const destAddress =
      direction === 'in' && transaction.outputs.length > 1
        ? transaction.outputs[1].destination
        : transaction.outputs[0].destination
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

const isMlAddressValid = (address, network) => {
  const mainnetRegex = /^mtc1[a-z0-9]{30,}$/
  const testnetRegex = /^tmt1[a-z0-9]{30,}$/
  return network === AppInfo.NETWORK_TYPES.MAINNET
    ? mainnetRegex.test(address)
    : testnetRegex.test(address)
}

export {
  getParsedTransactions,
  getAmountInAtoms,
  getAmountInCoins,
  isMlAddressValid,
}
