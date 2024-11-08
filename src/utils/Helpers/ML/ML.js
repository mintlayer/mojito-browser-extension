import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'
import { LocalStorageService } from '@Storage'

const getAmountInCoins = (
  amointInAtoms,
  atomsPerCoin = AppInfo.ML_ATOMS_PER_COIN,
) => {
  return amointInAtoms / atomsPerCoin
}

const getAmountInAtoms = (
  amountInCoins,
  atomsPerCoin = AppInfo.ML_ATOMS_PER_COIN,
) => {
  return BigInt(Math.round(amountInCoins * atomsPerCoin))
}

const getParsedTransactions = (transactions, addresses) => {
  const account = LocalStorageService.getItem('unlockedAccount')
  const networkType = LocalStorageService.getItem('networkType')
  const accountName = account && account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const unconfirmedTransactions = LocalStorageService.getItem(
    unconfirmedTransactionString,
  )
  const filteredTransactions = ArrayHelper.removeDublicates(transactions)
  const sortedTransactions = filteredTransactions.sort(
    (a, b) => b.timestamp - a.timestamp,
  )

  const isUncofirmedTransactionInList =
    unconfirmedTransactions &&
    sortedTransactions.some(
      (transaction) =>
        unconfirmedTransactions.filter(
          (unconfirmedTransaction) =>
            unconfirmedTransaction.txid === transaction.txid,
        ).length > 0,
    )

  if (unconfirmedTransactions && isUncofirmedTransactionInList) {
    const unconfirmedTransactionsWithoutConfirmed =
      unconfirmedTransactions.filter(
        (unconfirmedTransaction) =>
          !sortedTransactions.some(
            (transaction) => transaction.txid === unconfirmedTransaction.txid,
          ),
      )
    LocalStorageService.setItem(
      unconfirmedTransactionString,
      unconfirmedTransactionsWithoutConfirmed,
    )
  }

  if (unconfirmedTransactions && !isUncofirmedTransactionInList) {
    sortedTransactions.unshift(...unconfirmedTransactions)
  }

  return sortedTransactions.map((transaction) => {
    if (!transaction.outputs) {
      return {
        direction: transaction.direction,
        destAddress: transaction.destAddress,
        value: transaction.value,
        confirmations: transaction.confirmations,
        date: transaction.date,
        txid: transaction.txid,
        fee: transaction.fee,
        isConfirmed: transaction.isConfirmed,
        type: transaction.type,
      }
    }

    let withInputUTXO = true

    if (!transaction.inputs[0].utxo) {
      withInputUTXO = false
    }

    const isInputMine = withInputUTXO
      ? addresses.some((address) =>
          transaction.inputs.find(
            (input) => input?.utxo?.destination === address,
          ),
        ) // if at least one input is mine
      : !addresses.some(
          (address) => transaction.outputs[0].destination === address,
        )

    const direction = isInputMine ? 'out' : 'in'

    let type = 'Transfer'
    let destAddress
    let value
    let sameWalletTransaction = false

    const token_id = transaction.outputs.find(
      (output) => output?.value?.token_id,
    )?.value?.token_id

    // outbound transaction
    if (direction === 'out' && transaction.inputs.length > 0) {
      const destAddressOutput = transaction.outputs.find((output) => {
        return !addresses.includes(output.destination)
      })

      if (!destAddressOutput) {
        destAddress = transaction.outputs[0].destination
        sameWalletTransaction = true
      } else {
        destAddress = destAddressOutput.destination
      }

      const totalValue = transaction.outputs.reduce((acc, output) => {
        if (!addresses.includes(output.destination)) {
          if (output.type === 'Transfer') {
            return acc + output.value.amount.decimal
          }
          if (output.type === 'LockThenTransfer') {
            return acc + Number(output.value.amount.decimal)
          }
          if (output.type === 'CreateStakePool') {
            type = 'CreateStakePool'
            destAddress = output.pool_id
            return acc + Number(output.data.amount.decimal)
          }
          if (output.type === 'DelegateStaking') {
            type = 'DelegateStaking'
            destAddress = output.delegation_id
            return acc + Number(output.amount.decimal)
          }
          if (output.type === 'CreateDelegationId') {
            type = 'CreateDelegationId'
            destAddress = output.pool_id
            sameWalletTransaction = false
            return acc + Number(0)
          }
        }
        if (addresses.includes(output.destination)) {
          if (output.type === 'CreateStakePool') {
            type = 'CreateStakePool'
            destAddress = output.pool_id
            return acc + Number(output.data.amount.decimal)
          }
          if (output.type === 'DelegateStaking') {
            type = 'DelegateStaking'
            destAddress = output.delegation_id
            return acc + Number(output.amount.decimal)
          }
          if (output.type === 'CreateDelegationId') {
            type = 'CreateDelegationId'
            destAddress = output.pool_id
            sameWalletTransaction = false
            return acc + Number(0)
          }
        }
        return acc
      }, 0)
      value = totalValue
    }

    // inbound transaction
    if (withInputUTXO && direction === 'in' && transaction.outputs.length > 0) {
      destAddress = transaction.inputs[0].utxo.destination
      const totalValue = transaction.outputs
        .filter(({ destination }) => addresses.includes(destination))
        .reduce((acc, output) => {
          if (token_id) {
            if (output.value.token_id === token_id) {
              return acc + output.value.amount.decimal
            }
          } else {
            if (output.type === 'Transfer') {
              if (output.value.type === 'Coin') {
                return acc + output.value.amount.decimal
              }
            }
            if (output.type === 'LockThenTransfer') {
              if (output.value.type === 'Coin') {
                return acc + Number(output.value.amount.decimal)
              }
            }
          }
          return acc // return the accumulator if none of the conditions are met
        }, 0)
      value = totalValue
    }

    // if there is no input utxo, that is staking reward
    if (
      !withInputUTXO &&
      direction === 'in' &&
      transaction.outputs.length > 0
    ) {
      destAddress = transaction.outputs.find(
        (output) => !addresses.includes(output.destination),
      )?.destination

      const totalValue = transaction.outputs.reduce((acc, output) => {
        if (addresses.includes(output.destination)) {
          if (output.type === 'Transfer') {
            return acc + output.value.amount.decimal
          }
          if (output.type === 'LockThenTransfer') {
            if (
              transaction.inputs[0].input?.account_type === 'DelegationBalance'
            ) {
              type = 'Delegate Withdrawal'
              destAddress = transaction.inputs[0].input?.delegation_id
            }

            return acc + Number(output.value.amount.decimal)
          }
        }
        return acc
      }, 0)
      value = totalValue
    }

    const confirmations = transaction.confirmations
    const date = transaction.timestamp
    const txid = transaction.txid
    const fee = transaction.fee.decimal
    const isConfirmed = confirmations > 0
    const blockId = transaction.block_id

    return {
      blockId,
      direction,
      destAddress,
      value: value || 0,
      confirmations,
      date,
      txid,
      fee,
      isConfirmed,
      type,
      sameWalletTransaction,
      token_id,
    }
  })
}

const getTokenBalances = (utxos) => {
  const tokenBalances = {}
  utxos.forEach((item) => {
    if (item.utxo.value.token_id && item.utxo.value.type === 'TokenV1') {
      const token = item.utxo.value.token_id
      if (tokenBalances[token]) {
        tokenBalances[token] += parseFloat(item.utxo.value.amount.decimal)
      } else {
        tokenBalances[token] = parseFloat(item.utxo.value.amount.decimal)
      }
    }
  })

  return tokenBalances
}

const isMlAddressValid = (address, network) => {
  const mainnetRegex = /^mtc1[a-z0-9]{30,}$/
  const testnetRegex = /^tmt1[a-z0-9]{30,}$/
  return network === AppInfo.NETWORK_TYPES.MAINNET
    ? mainnetRegex.test(address)
    : testnetRegex.test(address)
}

const isMlPoolIdValid = (poolId, network) => {
  const mainnetRegex = /^mpool[a-z0-9]{30,}$/
  const testnetRegex = /^tpool[a-z0-9]{30,}$/
  return network === AppInfo.NETWORK_TYPES.MAINNET
    ? mainnetRegex.test(poolId)
    : testnetRegex.test(poolId)
}

const isMlDelegationIdValid = (delegationId, network) => {
  const mainnetRegex = /^mdelg[a-z0-9]{30,}$/
  const testnetRegex = /^tdelg[a-z0-9]{30,}$/
  return network === AppInfo.NETWORK_TYPES.MAINNET
    ? mainnetRegex.test(delegationId)
    : testnetRegex.test(delegationId)
}

const formatAddress = (address) => {
  if (!address) {
    return 'Wrong address'
  }
  const limitSize = 24
  const halfLimit = limitSize / 2
  const firstPart = address.slice(0, halfLimit)
  const lastPart = address.slice(address.length - halfLimit, address.length)
  return `${firstPart}...${lastPart}`
}

export {
  getParsedTransactions,
  getAmountInAtoms,
  getAmountInCoins,
  isMlAddressValid,
  isMlPoolIdValid,
  isMlDelegationIdValid,
  getTokenBalances,
  formatAddress,
}
