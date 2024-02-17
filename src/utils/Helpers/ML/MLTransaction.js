/* eslint-disable max-params */
import { ML } from '@Cryptos'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'
import { ML as MLHelpers } from '@Helpers'
import { AppInfo } from '@Constants'

const getUtxoBalance = (utxo) => {
  return utxo.reduce((sum, item) => sum + Number(item.utxo.value.amount), 0)
}

const getUtxoTransaction = (utxo) => {
  return utxo.map((item) => ({
    transaction: item.outpoint.id.Transaction,
    index: item.outpoint.index,
  }))
}

const getUtxoTransactionsBytes = (transactions) => {
  return transactions.map((transaction) => {
    return {
      bytes: Buffer.from(transaction.transaction, 'hex'),
      index: transaction.index,
    }
  })
}

const getOutpointedSourceId = async (transactionsBytes) => {
  return await Promise.all(
    transactionsBytes.map(async (transaction) => {
      return {
        sourcedID: await ML.getEncodedOutpointSourceId(transaction.bytes),
        index: transaction.index,
      }
    }),
  )
}

const getTxInput = async (outpointSourceId) => {
  return await Promise.all(
    outpointSourceId.map((outpoint) => {
      return ML.getTxInput(outpoint.sourcedID, outpoint.index)
    }),
  )
}

const getTransactionUtxos = (utxos, amountToUse, fee = 0) => {
  let balance = 0
  const utxosToSpend = []

  for (let i = 0; i < utxos.length; i++) {
    const utxoBalance = getUtxoBalance(utxos[i])
    if (balance < Number(amountToUse) + fee) {
      balance += utxoBalance
      utxosToSpend.push(utxos[i])
    } else {
      break
    }
  }
  return utxosToSpend
}

const getUtxoTransactions = (utxos) => {
  const txTransactions = utxos.map((utxo) => {
    return getUtxoTransaction(utxo)
  })
  return txTransactions
}

const getTransactionsBytes = (transactions) => {
  const transactionsBytes = transactions.map((transaction) => {
    return getUtxoTransactionsBytes(transaction)
  })
  return transactionsBytes
}

const getOutpointedSourceIds = async (transactionBytes) => {
  const outpointSourceIds = await Promise.all(
    transactionBytes.map((transaction) => {
      return getOutpointedSourceId(transaction)
    }),
  )
  return outpointSourceIds
}

const getTxInputs = async (outpointSourceIds) => {
  const txInputs = await Promise.all(
    outpointSourceIds.map((outpointSourceId) => {
      return getTxInput(outpointSourceId)
    }),
  )
  return txInputs
}

const getTxOutput = async (amount, address, networkType) => {
  const txOutput = await ML.getOutputs(amount, address, networkType)
  return txOutput
}

const getTransactionHex = (encodedSignedTransaction) => {
  return encodedSignedTransaction.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
    '',
  )
}

const getOptUtxos = async (utxos, network) => {
  const opt_utxos = await Promise.all(
    utxos.map((item) => {
      return ML.getOutputs(
        item.utxo.value.amount,
        item.utxo.destination,
        network,
      )
    }),
  )

  const result = []
  for (let i = 0; i < opt_utxos.length; i++) {
    result.push(1)
    result.push(...opt_utxos[i])
  }

  return result
}

const getEncodedWitnesses = async (
  utxos,
  keysList,
  transaction,
  opt_utxos,
  network,
  // eslint-disable-next-line max-params
) => {
  const data = utxos.flat()
  const encodedWitnesses = await Promise.all(
    data.map((utxo, index) => {
      const address = utxo.utxo.destination
      const addressPrivkey = keysList[address]
      return ML.getEncodedWitness(
        addressPrivkey,
        address,
        transaction,
        opt_utxos,
        index,
        network,
      )
    }),
  )
  return encodedWitnesses
}

const getArraySpead = (inputs) => {
  const inputsArray = []
  inputs.flat().forEach((input) => {
    input.forEach((item) => {
      inputsArray.push(item)
    })
  })
  return inputsArray
}

const totalUtxosAmount = (utxosToSpend) => {
  return utxosToSpend
    .flatMap((utxo) => [...utxo])
    .reduce((acc, utxo) => acc + Number(utxo.utxo.value.amount), 0)
}

const calculateFee = async (
  utxos,
  address,
  changeAddress,
  amountToUse,
  network,
) => {
  const totalAmount = totalUtxosAmount(utxos)
  if (totalAmount < Number(amountToUse)) {
    throw new Error('Insufficient funds')
  }
  const requireUtxo = getTransactionUtxos(utxos, amountToUse)
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = await getOutpointedSourceIds(transactionBytes)
  const inputs = await getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpead(inputs)
  const txOutput = await getTxOutput(amountToUse, address, network)
  const changeAmount = (
    totalUtxosAmount(requireUtxo) - Number(amountToUse)
  ).toString()
  const txChangeOutput = await getTxOutput(changeAmount, changeAddress, network)
  const outputs = [...txOutput, ...txChangeOutput]
  const optUtxos = await getOptUtxos(requireUtxo.flat(), network)
  const size = await ML.getEstimatetransactionSize(
    inputsArray,
    optUtxos,
    outputs,
  )
  const feeEstimatesResponse = await Mintlayer.getFeesEstimates()
  const feeEstimates = JSON.parse(feeEstimatesResponse)
  const fee = Math.ceil((Number(feeEstimates) / 1000) * size)

  return fee
}

const sendTransaction = async (
  utxos,
  keysList,
  address,
  changeAddress,
  amountToUse,
  network,
) => {
  const totalAmount = totalUtxosAmount(utxos)
  const fee = await calculateFee(
    utxos,
    address,
    changeAddress,
    amountToUse,
    network,
  )
  let amount = amountToUse
  if (totalAmount < Number(amountToUse) + fee) {
    amount = totalAmount - fee
  }

  const requireUtxo = getTransactionUtxos(utxos, amount, fee)
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = await getOutpointedSourceIds(transactionBytes)
  const inputs = await getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpead(inputs)
  const txOutput = await getTxOutput(amount.toString(), address, network)
  const changeAmount = (
    totalUtxosAmount(requireUtxo) -
    Number(amount) -
    fee
  ).toString()
  const txChangeOutput = await getTxOutput(changeAmount, changeAddress, network)
  const outputs = [...txOutput, ...txChangeOutput]
  const optUtxos = await getOptUtxos(requireUtxo.flat(), network)
  const transaction = await ML.getTransaction(inputsArray, outputs)
  const encodedWitnesses = await getEncodedWitnesses(
    requireUtxo,
    keysList,
    transaction,
    optUtxos,
    network,
  )
  const finalWitnesses = getArraySpead(encodedWitnesses)
  const encodedSignedTransaction = await ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)
  const result = await Mintlayer.broadcastTransaction(transactionHex)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${network}`
  const unconfirmedTransactions = LocalStorageService.getItem(
    unconfirmedTransactionString,
  )

  if (!unconfirmedTransactions) {
    const transaction = {
      direction: 'out',
      destAddress: address,
      value: MLHelpers.getAmountInCoins(amount),
      confirmations: 0,
      date: '',
      txid: JSON.parse(result).tx_id,
      fee: fee,
      isConfirmed: false,
    }
    LocalStorageService.setItem(unconfirmedTransactionString, transaction)
    return JSON.parse(result).tx_id
  } else {
    return 'Transaction already in progress. You have to wait for confirmation.'
  }
}

export {
  getUtxoBalance,
  getUtxoTransaction,
  getUtxoTransactionsBytes,
  getOutpointedSourceId,
  getTransactionUtxos,
  getUtxoTransactions,
  getTransactionsBytes,
  getOutpointedSourceIds,
  getTxInputs,
  getTxOutput,
  getTransactionHex,
  getOptUtxos,
  getEncodedWitnesses,
  calculateFee,
  sendTransaction,
}
