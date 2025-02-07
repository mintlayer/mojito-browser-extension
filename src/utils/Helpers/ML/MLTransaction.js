/* eslint-disable max-params */
import { ML } from '@Cryptos'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'
import { ML as MLHelpers } from '@Helpers'
import { AppInfo } from '@Constants'

const getUtxoBalance = (item) => {
  return BigInt(item.utxo.value.amount.atoms)
}

const getUtxoTransaction = (item) => {
  return {
    transaction: item.outpoint.source_id,
    index: item.outpoint.index,
  }
}

const getUtxoTransactionsBytes = (transaction) => {
  return {
    bytes: Buffer.from(transaction.transaction, 'hex'),
    index: transaction.index,
  }
}

const getOutpointedSourceId = (transactionsBytes) => {
  return {
    sourcedID: ML.getEncodedOutpointSourceId(transactionsBytes.bytes),
    index: transactionsBytes.index,
  }
}

const getTxInput = (outpoint) => {
  return ML.getTxInput(outpoint.sourcedID, outpoint.index)
}

/**
 * Get utxos to spend
 * NOTE: This function require optimization to get UTXOs with the lowest amounts first or 50% lowest and 50% highest, see: https://arxiv.org/pdf/2311.01113.pdf
 * At this point there is a risk of not having enough UTXOs to spend because first picked UTXOs is equal to the amount to spend without fee
 * In that case backend will return error with proper fee amount wich is parsed and passed as override fee value.
 * Need to add some "backup" additional UTXO is AMOUNT is equal of UTXOs amount so that server error less likely to happen but I'm leaving it just to be sure
 * @param utxos
 * @param amountToUse
 * @param fee
 * @returns {*[]}
 */
const getTransactionUtxos = ({ utxos, amount, tokenId }) => {
  let balance = BigInt(0)
  const utxosToSpend = []
  let lastIndex = 0

  for (let i = 0; i < utxos.length; i++) {
    lastIndex = i
    const utxoBalance = getUtxoBalance(utxos[i], tokenId)
    console.log(
      'balance < BigInt(amount)',
      balance < BigInt(amount),
      balance,
      BigInt(amount),
    )
    if (balance < BigInt(amount)) {
      balance += utxoBalance
      utxosToSpend.push(utxos[i])
    } else {
      break
    }
  }

  if (balance === BigInt(amount)) {
    // pick up extra UTXO
    if (utxos[lastIndex + 1]) {
      utxosToSpend.push(utxos[lastIndex + 1])
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

const getOutpointedSourceIds = (transactionBytes) => {
  const outpointSourceIds = transactionBytes.map((transaction) => {
    return getOutpointedSourceId(transaction)
  })
  return outpointSourceIds
}

const getTxInputs = (outpointSourceIds) => {
  const txInputs = outpointSourceIds.map((outpointSourceId) => {
    return getTxInput(outpointSourceId)
  })
  return txInputs
}

const getTxOutput = ({
  amount,
  address,
  networkType,
  poolId,
  delegationId,
  chainTip,
  tokenId,
}) => {
  const txOutput = poolId
    ? ML.getDelegationOutput(poolId, address, networkType)
    : delegationId
      ? ML.getStakingOutput(amount, delegationId, networkType)
      : ML.getOutputs({ amount, address, networkType, chainTip, tokenId })
  return txOutput
}

const getTransactionHex = (encodedSignedTransaction) => {
  return encodedSignedTransaction.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
    '',
  )
}

const getOptUtxos = (utxos, network, chainTip) => {
  const opt_utxos = utxos.map((item) => {
    return ML.getOutputs({
      amount: item?.utxo?.value?.amount?.atoms || '0',
      address: item.utxo.destination,
      networkType: network,
      type: item.utxo.type,
      lock: item.utxo.lock,
      tokenId: item?.utxo?.value?.token_id || item.utxo.token_id,
      utxo: item,
      chainTip,
    })
  })

  const result = []
  for (let i = 0; i < opt_utxos.length; i++) {
    result.push(1)
    result.push(...opt_utxos[i])
  }

  return result
}

const getEncodedWitnesses = (
  utxos,
  keysList,
  transaction,
  opt_utxos,
  network,
  // eslint-disable-next-line max-params
) => {
  const data = utxos.flat()
  const encodedWitnesses = data.map((utxo, index) => {
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
  })

  return encodedWitnesses
}

const getArraySpread = (inputs) => {
  const inputsArray = []
  inputs.flat().forEach((input) => {
    input.forEach((item) => {
      inputsArray.push(item)
    })
  })
  return inputsArray
}

export const totalUtxosAmount = (utxosToSpend, token) => {
  return utxosToSpend.reduce((acc, utxo) => {
    const requiredToken = token
      ? utxo.utxo.value.token_id === token
      : utxo.utxo.value.type === 'Coin'
    const amount =
      utxo?.utxo?.value?.amount && requiredToken
        ? BigInt(utxo.utxo.value.amount.atoms)
        : BigInt(0)
    return acc + amount
  }, BigInt(0))
}

const getUtxoAddress = (utxosToSpend) => {
  return utxosToSpend.map((utxo) => utxo.utxo.destination)
}

const calculateTransactionSizeInBytes = async ({
  utxos,
  address,
  changeAddress,
  amountToUse,
  network,
  poolId,
  delegationId,
  tokenId,
  approximateFee,
}) => {
  const isToken = !!tokenId
  const amountToUseFinaleCoin = !isToken
    ? BigInt(amountToUse) + BigInt(approximateFee)
    : BigInt(approximateFee)
  const amountToUseFinaleToken = isToken ? BigInt(amountToUse) : BigInt(0)
  const totalAmountCoin = !poolId ? totalUtxosAmount(utxos) : BigInt(0)
  const totalAmountToken = isToken
    ? totalUtxosAmount(utxos, tokenId)
    : BigInt(0)
  if (totalAmountCoin < BigInt(amountToUseFinaleCoin) && !poolId) {
    throw new Error('Insufficient ML')
  }
  if (totalAmountToken < BigInt(amountToUseFinaleToken)) {
    throw new Error('Insufficient Tokens')
  }

  const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')
  const utxoToken = isToken
    ? utxos.filter((utxo) => {
        return utxo.utxo?.value?.token_id === tokenId
      })
    : []

  const requireUtxoCoin = getTransactionUtxos({
    utxos: utxoCoin,
    amount: amountToUseFinaleCoin,
  })
  const requireUtxoToken = isToken
    ? getTransactionUtxos({
        utxos: utxoToken,
        amount: amountToUseFinaleToken,
        tokenId,
      })
    : []
  const requireUtxo = [...requireUtxoCoin, ...requireUtxoToken]
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const addressList = getUtxoAddress(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = await getOutpointedSourceIds(transactionBytes)
  const inputs = await getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputs)
  const txOutput = getTxOutput({
    amount: isToken
      ? amountToUseFinaleToken.toString()
      : amountToUseFinaleCoin.toString(),
    address,
    networkType: network,
    poolId,
    delegationId,
    tokenId,
  })
  const changeAmountCoin = (
    totalUtxosAmount(requireUtxoCoin) - amountToUseFinaleCoin
  ).toString()
  const txChangeOutputCoin = getTxOutput({
    amount: changeAmountCoin,
    address: changeAddress,
    networkType: network,
  })

  const changeAmountToken = (
    totalUtxosAmount(requireUtxoToken, tokenId) - amountToUseFinaleToken
  ).toString()

  const txChangeOutputToken = isToken
    ? getTxOutput({
        amount: changeAmountToken,
        address: changeAddress,
        networkType: network,
        tokenId,
      })
    : []
  const txChangeOutput = [...txChangeOutputCoin, ...txChangeOutputToken]
  const outputs = [...txOutput, ...txChangeOutput]
  const size = ML.getEstimatetransactionSize(
    inputsArray,
    addressList,
    outputs,
    network,
  )

  return size
}

const calculateIssueNftTxSizeInBytes = async ({
  utxos,
  address,
  changeAddress,
  amountToUse,
  network,
  nftUtxo,
  tokenId,
  approximateFee,
}) => {
  const fee = approximateFee
  if (fee > BigInt(AppInfo.MAX_ML_FEE)) {
    throw new Error('Fee is too high, please try again later.')
  }
  const amountCoinFee = BigInt(fee)
  const amountNft = BigInt(amountToUse)
  const amountToUseFinaleCoin = amountCoinFee
  const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')

  const totalAmountCoin = totalUtxosAmount(utxos)
  if (totalAmountCoin < BigInt(amountToUseFinaleCoin)) {
    throw new Error('Insufficient ML')
  }

  const requireUtxoCoin = getTransactionUtxos({
    utxos: utxoCoin,
    amount: amountToUseFinaleCoin,
  })

  const changeAmountCoin = (
    totalUtxosAmount(requireUtxoCoin) - amountToUseFinaleCoin
  ).toString()

  const requireUtxo = [...nftUtxo, ...requireUtxoCoin]

  const addressList = getUtxoAddress(requireUtxo)
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = getOutpointedSourceIds(transactionBytes)
  const inputs = getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputs)

  const txNftOutput = getTxOutput({
    amount: amountNft.toString(),
    address,
    networkType: network,
    tokenId,
  })

  const txChangeOutput = getTxOutput({
    amount: changeAmountCoin,
    address: changeAddress,
    networkType: network,
  })

  const outputs = [...txNftOutput, ...txChangeOutput]
  const size = ML.getEstimatetransactionSize(
    inputsArray,
    addressList,
    outputs,
    network,
  )

  return size
}

const calculateCustomTransactionSizeInBytes = async ({
  network,
  inputs,
  outputs,
  currentHeight,
}) => {
  const requireUtxo = inputs
  const addressList = getUtxoAddress(requireUtxo)
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = await getOutpointedSourceIds(transactionBytes)
  const inputsIds = await getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputsIds)

  // make array from outputs with await
  const outputsArrayItems = outputs.map((output) => {
    if (output.type === 'Transfer') {
      return ML.getOutputs({
        amount: BigInt(output.value.amount.atoms).toString(),
        address: output.destination,
        networkType: network,
      })
    }
    if (output.type === 'IssueFungibleToken') {
      return ML.getOutputIssueFungibleToken({
        output,
        network,
        chainTip: currentHeight,
      })
    }
    if (output.type === 'IssueNft') {
      return ML.getOutputIssueNft({
        inputs: inputsArray,
        output,
        network,
        chainTip: currentHeight,
      })
    }
    if (output.type === 'DataDeposit') {
      return ML.getOutputDataDeposit({ output })
    }
  })

  console.log('outputsArrayItems', outputsArrayItems)

  const outputsArray = getArraySpread(outputsArrayItems)

  const size = ML.getEstimatetransactionSize(
    inputsArray,
    addressList,
    outputsArray,
    network,
  )

  return size
}

const calculateSpenDelegFee = async (
  address,
  amount,
  network,
  delegation,
  chainTip,
) => {
  const input = ML.getAccountOutpointInput(
    delegation.delegation_id,
    amount.toString(),
    delegation.next_nonce,
    network,
  )
  const inputsArray = [...input]

  const spendÒutput = ML.getOutputs({
    amount: amount.toString(),
    address: address,
    networkType: network,
    type: 'spendFromDelegation',
    lock: {
      content: 7200,
      type: 'ForBlockCount',
    },
    chainTip,
  })
  const outputs = [...spendÒutput]
  const size = ML.getEstimatetransactionSize(
    inputsArray,
    [address],
    outputs,
    network,
  )
  const feeEstimatesResponse = await Mintlayer.getFeesEstimates()
  const feeEstimates = JSON.parse(feeEstimatesResponse)
  const fee = Math.ceil((Number(feeEstimates) / 1000) * size)

  return fee
}

const sendTransaction = async ({
  utxos,
  keysList,
  address,
  changeAddress,
  amountToUse,
  network,
  poolId,
  delegationId,
  transactionMode,
  adjustedFee,
  tokenId,
}) => {
  const isToken = !!tokenId
  const fee = adjustedFee
  if (fee > BigInt(AppInfo.MAX_ML_FEE)) {
    throw new Error('Fee is too high, please try again later.')
  }

  const amountToUseFinaleCoin = !isToken
    ? BigInt(amountToUse) + BigInt(fee)
    : BigInt(fee)
  const amountToUseFinaleToken = isToken ? BigInt(amountToUse) : BigInt(0)
  const totalAmountCoin = !poolId ? totalUtxosAmount(utxos) : BigInt(0)
  const totalAmountToken = isToken
    ? totalUtxosAmount(utxos, tokenId)
    : BigInt(0)

  if (totalAmountCoin < BigInt(amountToUseFinaleCoin) && !poolId) {
    throw new Error('Insufficient ML')
  }
  if (totalAmountToken < BigInt(amountToUseFinaleToken)) {
    throw new Error('Insufficient Tokens')
  }

  const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')
  const utxoToken = isToken
    ? utxos.filter((utxo) => utxo.utxo.value.token_id === tokenId)
    : []

  const requireUtxoCoin = getTransactionUtxos({
    utxos: utxoCoin,
    amount: amountToUseFinaleCoin,
  })
  const requireUtxoToken = isToken
    ? getTransactionUtxos({
        utxos: utxoToken,
        amount: amountToUseFinaleToken,
        tokenId,
      })
    : []
  const requireUtxo = [...requireUtxoCoin, ...requireUtxoToken]
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = getOutpointedSourceIds(transactionBytes)
  const inputs = getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputs)

  const txOutput = getTxOutput({
    amount: amountToUse.toString(),
    address,
    networkType: network,
    poolId,
    delegationId,
    tokenId,
  })

  const changeAmountCoin = (
    totalUtxosAmount(requireUtxoCoin) - amountToUseFinaleCoin
  ).toString()
  const txChangeOutputCoin = getTxOutput({
    amount: changeAmountCoin,
    address: changeAddress,
    networkType: network,
  })

  const changeAmountToken = (
    totalUtxosAmount(requireUtxoToken, tokenId) - amountToUseFinaleToken
  ).toString()

  const txChangeOutputToken = isToken
    ? getTxOutput({
        amount: changeAmountToken,
        address: changeAddress,
        networkType: network,
        tokenId,
      })
    : []

  const txChangeOutput = [...txChangeOutputCoin, ...txChangeOutputToken]
  const outputs = [...txOutput, ...txChangeOutput]
  const optUtxos = getOptUtxos(requireUtxo, network)
  const transaction = ML.getTransaction(inputsArray, outputs)
  const encodedWitnesses = getEncodedWitnesses(
    requireUtxo,
    keysList,
    transaction,
    optUtxos, // in fact that is transaction inputs
    network,
  )
  const finalWitnesses = getArraySpread(encodedWitnesses)
  const encodedSignedTransaction = ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)
  const result = await Mintlayer.broadcastTransaction(transactionHex)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${network}`
  const unconfirmedTransactions =
    LocalStorageService.getItem(unconfirmedTransactionString) || []

  unconfirmedTransactions.push({
    direction: 'out',
    type: 'Unconfirmed',
    destAddress: address || delegationId,
    value: MLHelpers.getAmountInCoins(Number(amountToUse)),
    confirmations: 0,
    date: '',
    txid: JSON.parse(result).tx_id,
    fee: fee.toString(),
    isConfirmed: false,
    mode: transactionMode,
    poolId: poolId,
    delegationId: delegationId,
    usedUtxosOutpoints: requireUtxo.map(
      ({ outpoint: { index, source_id } }) => ({ index, source_id }),
    ),
  })
  LocalStorageService.setItem(
    unconfirmedTransactionString,
    unconfirmedTransactions,
  )
  return JSON.parse(result).tx_id
}

const sendCustomTransaction = async ({
  keysList,
  network,
  inputs,
  outputs,
  currentHeight,
}) => {
  const requireUtxo = inputs
  const transactionStrings = getUtxoTransactions(requireUtxo)
  // const addressList = getUtxoAddress(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = await getOutpointedSourceIds(transactionBytes)
  const inputsIds = await getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputsIds)

  console.log('sendCustomTransaction outputs', outputs)

  // make array from outputs with await
  const outputsArrayItems = outputs.map((output) => {
    if (output.type === 'Transfer') {
      return ML.getOutputs({
        amount: BigInt(output.value.amount.atoms).toString(),
        address: output.destination,
        networkType: network,
      })
    }
    if (output.type === 'IssueFungibleToken') {
      return ML.getOutputIssueFungibleToken({
        output,
        network,
        chainTip: currentHeight,
      })
    }
    if (output.type === 'IssueNft') {
      return ML.getOutputIssueNft({
        inputs: inputsArray,
        output,
        network,
        chainTip: currentHeight,
      })
    }
  })

  const outputsArray = getArraySpread(outputsArrayItems)

  const transaction = await ML.getTransaction(inputsArray, outputsArray)

  const optUtxos = await getOptUtxos(requireUtxo, network)

  const encodedWitnesses = await getEncodedWitnesses(
    requireUtxo,
    keysList,
    transaction,
    optUtxos, // in fact that is transaction inputs
    network,
  )
  const finalWitnesses = getArraySpread(encodedWitnesses)
  const encodedSignedTransaction = await ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)

  return transactionHex
}

const spendFromDelegation = async (
  keysList,
  address,
  amount,
  network,
  delegation,
  chainTip,
) => {
  const fee = await calculateSpenDelegFee(
    address,
    amount,
    network,
    delegation,
    chainTip,
  )
  if (fee > AppInfo.MAX_ML_FEE) {
    throw new Error('Fee is too high, please try again later.')
  }
  let amountToUse = Number(amount) + fee
  let outputAmount = Number(amount)

  if (amountToUse > Number(delegation.balance)) {
    amountToUse = Number(delegation.balance)
    outputAmount = amountToUse - fee
  }

  const input = ML.getAccountOutpointInput(
    delegation.delegation_id,
    amountToUse.toString(),
    delegation.next_nonce,
    network,
  )
  const inputsArray = [...input]

  const spendÒutput = await ML.getOutputs({
    amount: outputAmount.toString(),
    address: address,
    networkType: network,
    type: 'spendFromDelegation',
    lock: {
      content: 7200,
      type: 'ForBlockCount',
    },
    chainTip,
  })
  const outputs = [...spendÒutput]
  const optUtxos = [0]

  const transaction = ML.getTransaction(inputsArray, outputs)

  const encodedWitnesses = ML.getEncodedWitness(
    keysList[address],
    address,
    transaction,
    optUtxos,
    0,
    network,
  )
  const finalWitnesses = [...encodedWitnesses]
  const encodedSignedTransaction = ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)
  const result = await Mintlayer.broadcastTransaction(transactionHex)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${network}`
  const unconfirmedTransactions =
    LocalStorageService.getItem(unconfirmedTransactionString) || []

  unconfirmedTransactions.push({
    direction: 'out',
    type: 'Unconfirmed',
    destAddress: address,
    value: MLHelpers.getAmountInCoins(Number(amount)),
    confirmations: 0,
    date: '',
    txid: JSON.parse(result).tx_id,
    fee: fee,
    isConfirmed: false,
  })
  LocalStorageService.setItem(
    unconfirmedTransactionString,
    unconfirmedTransactions,
  )
  return JSON.parse(result).tx_id
}

const sendIssueNft = async ({
  utxos,
  nftUtxo,
  keysList,
  address,
  changeAddress,
  amountToUse,
  network,
  transactionMode,
  adjustedFee,
  tokenId,
  chainTip,
}) => {
  const fee = adjustedFee
  if (fee > BigInt(AppInfo.MAX_ML_FEE)) {
    throw new Error('Fee is too high, please try again later.')
  }
  const amountCoinFee = BigInt(fee)
  const amountNft = BigInt(amountToUse)
  const amountToUseFinaleCoin = amountCoinFee
  const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')

  const totalAmountCoin = totalUtxosAmount(utxos)
  if (totalAmountCoin < BigInt(amountToUseFinaleCoin)) {
    throw new Error('Insufficient ML')
  }

  const requireUtxoCoin = getTransactionUtxos({
    utxos: utxoCoin,
    amount: amountToUseFinaleCoin,
  })

  const changeAmountCoin = (
    totalUtxosAmount(requireUtxoCoin) - amountToUseFinaleCoin
  ).toString()

  const requireUtxo = [...nftUtxo, ...requireUtxoCoin]
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = getOutpointedSourceIds(transactionBytes)
  const inputs = getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputs)

  const txNftOutput = getTxOutput({
    amount: amountNft.toString(),
    address,
    networkType: network,
    tokenId,
  })

  const txChangeOutput = getTxOutput({
    amount: changeAmountCoin,
    address: changeAddress,
    networkType: network,
  })

  const outputs = [...txNftOutput, ...txChangeOutput]
  const optUtxos = getOptUtxos(requireUtxo, network, chainTip)
  const transaction = ML.getTransaction(inputsArray, outputs)

  const encodedWitnesses = getEncodedWitnesses(
    requireUtxo,
    keysList,
    transaction,
    optUtxos,
    network,
  )
  const finalWitnesses = getArraySpread(encodedWitnesses)
  const encodedSignedTransaction = ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)
  const result = await Mintlayer.broadcastTransaction(transactionHex)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${network}`
  const unconfirmedTransactions =
    LocalStorageService.getItem(unconfirmedTransactionString) || []

  unconfirmedTransactions.push({
    direction: 'out',
    type: 'Unconfirmed',
    destAddress: address,
    value: MLHelpers.getAmountInCoins(Number(0)),
    confirmations: 0,
    date: '',
    txid: JSON.parse(result).tx_id,
    fee: fee.toString(),
    isConfirmed: false,
    mode: transactionMode,
    usedUtxosOutpoints: requireUtxo.map(
      ({ outpoint: { index, source_id } }) => ({ index, source_id }),
    ),
  })
  LocalStorageService.setItem(
    unconfirmedTransactionString,
    unconfirmedTransactions,
  )
  return JSON.parse(result).tx_id
}

// Function to create NFT, currently not used in the app, for the test purposes only
const createNft = async ({
  utxos,
  keysList,
  address,
  changeAddress,
  network,
  transactionMode,
  adjustedFee,
  chainTip,
}) => {
  // const fee = adjustedFee
  const fee = 600400000000
  const amountCoinFee = BigInt(fee)
  const amountToUseFinaleCoin = amountCoinFee
  const utxoCoin = utxos.filter((utxo) => utxo.utxo.value.type === 'Coin')

  const totalAmountCoin = totalUtxosAmount(utxos)
  if (totalAmountCoin < BigInt(amountToUseFinaleCoin)) {
    throw new Error('Insufficient ML')
  }

  const requireUtxoCoin = getTransactionUtxos({
    utxos: utxoCoin,
    amount: amountToUseFinaleCoin,
  })

  const changeAmountCoin = (
    totalUtxosAmount(requireUtxoCoin) - amountToUseFinaleCoin
  ).toString()

  const requireUtxo = [...requireUtxoCoin]
  const transactionStrings = getUtxoTransactions(requireUtxo)
  const transactionBytes = getTransactionsBytes(transactionStrings)
  const outpointedSourceIds = getOutpointedSourceIds(transactionBytes)
  const inputs = getTxInputs(outpointedSourceIds)
  const inputsArray = getArraySpread(inputs)

  const newTokenId = ML.getTokenId(inputsArray, network)

  const newTokenData = {
    tokenId: newTokenId,
    destenation: 'tmt1q9l3c8xear578dayhxh982vmtagsrd658vjq4py0',
    name: 'ttm1',
    ticker: 'TTM',
    description: 'TestTokenMy',
    mediaHash: '1c6e960410a2',
    creator: undefined,
    mediaUri:
      'ipfs://bafybeibw2yl6423eag43tlgeuptcedrf2flxpnpvtymsnqbpcfnlxjcz4i/photo_2024-10-03-23.24.04.jpeg',
    iconUri:
      'ipfs://bafybeibw2yl6423eag43tlgeuptcedrf2flxpnpvtymsnqbpcfnlxjcz4i/photo_2024-10-03-23.24.04.jpeg',
    additionalMetadata:
      'ipfs://bafkreiemhagc2snpjjndvdq4jxmh4lobg3mpte2z42brieqd3medgsgc4q',
    chainTip: BigInt(Number(chainTip)),
    networkType: 'testnet',
  }

  const txNftOutput = ML.getOutputIssueNft(
    newTokenData.tokenId,
    newTokenData.destenation,
    newTokenData.name,
    newTokenData.ticker,
    newTokenData.description,
    Buffer.from(newTokenData.mediaHash, 'hex'),
    newTokenData.creator,
    newTokenData.mediaUri,
    newTokenData.iconUri,
    newTokenData.additionalMetadata,
    BigInt(Number(chainTip)),
    'testnet',
  )

  const txChangeOutput = getTxOutput({
    amount: changeAmountCoin,
    address: changeAddress,
    networkType: network,
  })

  const outputs = [...txNftOutput, ...txChangeOutput]
  const optUtxos = getOptUtxos(requireUtxo, network, chainTip)
  const transaction = ML.getTransaction(inputsArray, outputs)

  console.log('sendNft222', {
    txNftOutput,
    txChangeOutput,
    outputs,
    optUtxos,
    transaction,
  })

  const encodedWitnesses = getEncodedWitnesses(
    requireUtxo,
    keysList,
    transaction,
    optUtxos,
    network,
  )
  const finalWitnesses = getArraySpread(encodedWitnesses)
  const encodedSignedTransaction = ML.getEncodedSignedTransaction(
    transaction,
    finalWitnesses,
  )
  const transactionHex = getTransactionHex(encodedSignedTransaction)
  const result = await Mintlayer.broadcastTransaction(transactionHex)

  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${network}`
  const unconfirmedTransactions =
    LocalStorageService.getItem(unconfirmedTransactionString) || []

  unconfirmedTransactions.push({
    direction: 'out',
    type: 'Unconfirmed',
    destAddress: address,
    value: MLHelpers.getAmountInCoins(Number(0)),
    confirmations: 0,
    date: '',
    txid: JSON.parse(result).tx_id,
    fee: fee.toString(),
    isConfirmed: false,
    mode: transactionMode,
    usedUtxosOutpoints: requireUtxo.map(
      ({ outpoint: { index, source_id } }) => ({ index, source_id }),
    ),
  })
  LocalStorageService.setItem(
    unconfirmedTransactionString,
    unconfirmedTransactions,
  )
  return JSON.parse(result).tx_id
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
  calculateSpenDelegFee,
  sendTransaction,
  sendCustomTransaction,
  spendFromDelegation,
  sendIssueNft,
  createNft,
  calculateTransactionSizeInBytes,
  calculateIssueNftTxSizeInBytes,
  calculateCustomTransactionSizeInBytes,
}
