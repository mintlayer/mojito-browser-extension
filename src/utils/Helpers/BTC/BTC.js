import { Electrum } from '@APIs'
import * as bitcoin from 'bitcoinjs-lib'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'
import Decimal from 'decimal.js'

const AVERAGE_MIN_PER_BLOCK = 15
const SATOSHI_BTC_CONVERSION_FACTOR = 100_000_000
const MAX_BTC = 21_000_000
const MAX_BTC_IN_SATOSHIS = MAX_BTC * SATOSHI_BTC_CONVERSION_FACTOR

const blockLevels = {
  25: 'LOW',
  4: 'MEDIUM',
  1: 'HIGH',
}

const parseFeesEstimates = (allEstimates) => {
  const blockValues = Object.keys(blockLevels)

  return Object.keys(allEstimates)
    .filter((blocksAmount) => blockValues.includes(blocksAmount))
    .map((blocksAmount) => ({
      [blockLevels[blocksAmount]]: allEstimates[blocksAmount],
    }))
    .reduce((acc, item) => {
      const levelName = Object.keys(item)[0]
      acc[levelName] = item[levelName]
      return acc
    }, {})
}

const convertSatoshiToBtc = (satoshiAmount) =>
  satoshiAmount / SATOSHI_BTC_CONVERSION_FACTOR

//Rounding is needed because of floating point issue in some cases like (0.00001 * 100_000_000)."
const convertBtcToSatoshi = (satoshiAmount) =>
  Math.round(satoshiAmount * SATOSHI_BTC_CONVERSION_FACTOR)

const calculateBalanceFromUtxoList = (list) => {
  return list.reduce(
    (accumulator, transaction) => accumulator + transaction.value,
    0,
  )
}

const getConfirmationsAmount = async (transaction) => {
  if (!transaction)
    return new Promise.reject('No transaction to check confirmations.')
  if (!transaction.blockHeight) return Promise.resolve(0)

  const lastBlockHeight = await Electrum.getLastBlockHeight()
  return lastBlockHeight - transaction.blockHeight + 1
}

const getParsedTransactions = (rawTransactions, myAddresses) => {
  const mySet = new Set(
    Array.isArray(myAddresses) ? myAddresses : [myAddresses].filter(Boolean),
  )

  const isMineIn = (vin) =>
    vin?.prevout && mySet.has(vin.prevout.scriptpubkey_address)
  const isMineOut = (vout) => mySet.has(vout?.scriptpubkey_address)

  const toSats = (n) => Number(n) || 0

  return (rawTransactions || []).map((tx) => {
    const inputs = tx.vin || []
    const outputs = tx.vout || []

    const inputSum = inputs.reduce((s, i) => s + toSats(i?.prevout?.value), 0)
    const outputSum = outputs.reduce((s, o) => s + toSats(o?.value), 0)
    const feeSats = toSats(tx.fee ?? (inputSum > 0 ? inputSum - outputSum : 0))

    const hasInputFromMe = inputs.some(isMineIn)
    const toMeSats = outputs
      .filter(isMineOut)
      .reduce((s, o) => s + toSats(o.value), 0)
    const toOthersSats = outputs
      .filter((o) => !isMineOut(o))
      .reduce((s, o) => s + toSats(o.value), 0)

    const direction = hasInputFromMe ? 'out' : 'in'

    let amountSats = 0
    let changeSats = 0
    if (direction === 'in') {
      amountSats = toMeSats // received
      changeSats = 0
    } else {
      amountSats = toOthersSats // sent to others (excludes change)
      changeSats = toMeSats // change back to me
    }

    return {
      txid: tx.txid,
      date: tx.status?.block_time,
      blockHeight: tx.status?.block_height,
      direction,
      value: convertSatoshiToBtc(amountSats),
      change: convertSatoshiToBtc(changeSats),
      fee: convertSatoshiToBtc(feeSats),
      from: inputs.map((i) => i?.prevout?.scriptpubkey_address).filter(Boolean),
      to: outputs.map((o) => o?.scriptpubkey_address).filter(Boolean),
    }
  })
}

const getYesterdayFiatBalances = (cryptos, yesterdayExchangeRateList) => {
  const btcCrypto = cryptos.find((crypto) => crypto.symbol === 'BTC')
  const mlCrypto = cryptos.find((crypto) => crypto.symbol === 'ML')

  const btcYesterdayBalance = btcCrypto
    ? btcCrypto.balance * yesterdayExchangeRateList.btc
    : 0
  const mlYesterdayBalance = mlCrypto
    ? mlCrypto.balance * yesterdayExchangeRateList.ml
    : 0
  const totalYesterdayBalance = btcYesterdayBalance + mlYesterdayBalance

  return { btcYesterdayBalance, mlYesterdayBalance, totalYesterdayBalance }
}

const getCurrentFiatBalances = (cryptos) => {
  const btcCrypto = cryptos.find((crypto) => crypto.symbol === 'BTC')
  const mlCrypto = cryptos.find((crypto) => crypto.symbol === 'ML')

  const btcCurrentBalance = btcCrypto
    ? btcCrypto.balance * btcCrypto.exchangeRate
    : 0
  const mlCurrentBalance = mlCrypto
    ? mlCrypto.balance * mlCrypto.exchangeRate
    : 0
  const totalCurrentBalance =
    cryptos.reduce(
      (acc, crypto) => acc + crypto.balance * crypto.exchangeRate,
      0,
    ) || 0

  return { btcCurrentBalance, mlCurrentBalance, totalCurrentBalance }
}

const calculateBalances = (cryptos, yesterdayExchangeRates) => {
  const { btcYesterdayBalance, mlYesterdayBalance, totalYesterdayBalance } =
    getYesterdayFiatBalances(cryptos, yesterdayExchangeRates)

  const { btcCurrentBalance, mlCurrentBalance, totalCurrentBalance } =
    getCurrentFiatBalances(cryptos)

  const currentBalances = {
    btc: btcCurrentBalance,
    ml: mlCurrentBalance,
    total: totalCurrentBalance,
  }

  const yesterdayBalances = {
    btc: btcYesterdayBalance,
    ml: mlYesterdayBalance,
    total: totalYesterdayBalance,
  }

  const proportionDiffs = {
    btc: currentBalances.btc / yesterdayBalances.btc,
    ml: currentBalances.ml / yesterdayBalances.ml,
    total: currentBalances.total / yesterdayBalances.total,
  }

  const balanceDiffs = {
    btc: currentBalances.btc - btcYesterdayBalance,
    ml: currentBalances.ml - mlYesterdayBalance,
    total: currentBalances.total - yesterdayBalances.total,
  }

  return { currentBalances, yesterdayBalances, proportionDiffs, balanceDiffs }
}

const getStats = (proportionDiffs, balanceDiffs, networkType) => {
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const percentValue = isTestnet
    ? 0
    : Number((proportionDiffs.total - 1) * 100).toFixed(2)
  const fiatValue = isTestnet ? 0 : balanceDiffs.total.toFixed(2)
  return [
    {
      name: '24h percent',
      value: percentValue,
      unit: '%',
    },
    {
      name: '24h fiat',
      value: fiatValue,
      unit: 'USD',
    },
  ]
}

const getNetwork = () => {
  const networkType =
    LocalStorageService.getItem('networkType') === 'testnet'
      ? 'testnet'
      : 'bitcoin'
  return bitcoin.networks[networkType]
}

const checkFee = (psbt, fee, maxFee, maxFeeRate) => {
  try {
    const feeDec = new Decimal(fee)
    const tx = psbt.extractTransaction()
    const vsize = new Decimal(tx.virtualSize())

    const feeRate = feeDec.div(vsize)

    if (feeDec.gt(maxFee)) {
      console.warn(
        'Transaction fee too high (absolute):',
        feeDec.toString(),
        'sats',
      )
      return false
    }

    if (feeRate.gt(maxFeeRate)) {
      console.warn('Fee rate too high:', feeRate.toFixed(2), 'sat/vB')
      return false
    }

    console.log(
      'Fee looks safe:',
      feeDec.toString(),
      'sats ~',
      feeRate.toFixed(2),
      'sat/vB',
    )
    return true
  } catch (err) {
    console.error('checkFee error:', err.message)
    return false
  }
}

const getBtcAddressLink = (address, networkType) => {
  if (!address) {
    return ''
  }
  const baseUrl =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? AppInfo.BTC_EXPLORER_MAINNET
      : AppInfo.BTC_EXPLORER_TESTNET
  return `${baseUrl}address/${address}`
}

const getBtcTransactionLink = (txId, networkType) => {
  if (!txId) {
    return ''
  }
  const baseUrl =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? AppInfo.BTC_EXPLORER_MAINNET
      : AppInfo.BTC_EXPLORER_TESTNET
  return `${baseUrl}tx/${txId}`
}

const getBtcAddresses = (addresses) => {
  if (!addresses || addresses.length === 0) return []
  const btcReceivingAddresses = addresses.btcReceivingAddresses.map((item) => ({
    [item.address]: { pubkey: item.pubkey },
  }))
  const btcChangeAddresses = addresses.btcChangeAddresses.map((item) => ({
    [item.address]: { pubkey: item.pubkey },
  }))
  return { btcChangeAddresses, btcReceivingAddresses }
}

const getBatchData = async (ids, networkRequest) => {
  const uniqueIds = [...new Set(ids)]

  if (uniqueIds.length > AppInfo.BATCH_REQUEST_BITCOIN_LIMIT) {
    const chunks = []
    for (
      let i = 0;
      i < uniqueIds.length;
      i += AppInfo.BATCH_REQUEST_BITCOIN_LIMIT
    ) {
      chunks.push(uniqueIds.slice(i, i + AppInfo.BATCH_REQUEST_BITCOIN_LIMIT))
    }

    const allPromises = chunks.map((chunk) => networkRequest(chunk))
    const allResults = await Promise.all(allPromises)
    return allResults.flat()
  }

  return await networkRequest(uniqueIds)
}

export {
  parseFeesEstimates,
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  getConfirmationsAmount,
  convertBtcToSatoshi,
  getYesterdayFiatBalances,
  calculateBalances,
  getStats,
  getNetwork,
  checkFee,
  getBtcAddressLink,
  getBtcTransactionLink,
  getBtcAddresses,
  getBatchData,
  AVERAGE_MIN_PER_BLOCK,
  MAX_BTC_IN_SATOSHIS,
  MAX_BTC,
}
