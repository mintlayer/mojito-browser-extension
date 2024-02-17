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
  const networkType = LocalStorageService.getItem('networkType')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
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

    const isInputMine = addresses.some(
      (address) => transaction.inputs[0].utxo.destination === address,
    )

    const direction = isInputMine ? 'out' : 'in'

    let destAddress
    let value

    if (direction === 'out' && transaction.inputs.length > 0) {
      destAddress = transaction.outputs.find((output) => {
        return !addresses.includes(output.destination)
      }).destination

      const totalValue = transaction.outputs.reduce((acc, output) => {
        if (!addresses.includes(output.destination)) {
          if (output.type === 'Transfer') {
            return acc + output.value.amount
          }
          if (output.type === 'LockThenTransfer') {
            return acc + Number(output.value.amount)
          }
        }
        return acc
      }, 0)
      value = getAmountInCoins(totalValue, AppInfo.ML_ATOMS_PER_COIN)
    }

    if (direction === 'in' && transaction.outputs.length > 0) {
      destAddress = transaction.inputs[0].utxo.destination
      const totalValue = transaction.outputs.reduce((acc, output) => {
        if (addresses.includes(output.destination)) {
          if (output.type === 'Transfer') {
            return acc + output.value.amount
          }
          if (output.type === 'LockThenTransfer') {
            return acc + Number(output.value.amount)
          }
        }
        return acc
      }, 0)
      value = getAmountInCoins(totalValue, AppInfo.ML_ATOMS_PER_COIN)
    }

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
