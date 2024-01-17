import { Electrum } from '@APIs'
import * as bitcoin from 'bitcoinjs-lib'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'

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

const calculateBalanceFromUtxoList = (list) =>
  list.reduce((accumulator, transaction) => accumulator + transaction.value, 0)

const getConfirmationsAmount = async (transaction) => {
  if (!transaction)
    return new Promise.reject('No transaction to check confirmations.')
  if (!transaction.blockHeight) return Promise.resolve(0)

  const lastBlockHeight = await Electrum.getLastBlockHeight()
  return lastBlockHeight - transaction.blockHeight + 1
}

const getParsedTransactions = (rawTransactions, baseAddress) => {
  const getDirection = (transaction) =>
    transaction.vin.find(
      (item) => item.prevout.scriptpubkey_address === baseAddress,
    )
      ? 'out'
      : 'in'

  const getTransactionAmountInSatoshi = (direction, transaction) =>
    direction === 'in'
      ? transaction.vout.find(
          (item) => item.scriptpubkey_address === baseAddress,
        ).value
      : transaction.vout
          .filter((item) => item.scriptpubkey_address !== baseAddress)
          .reduce((acc, item) => acc + item.value, 0)

  const equalsBase = (item) => item.scriptpubkey_address === baseAddress
  const shouldAddAddressToList = (transaction, item) =>
    transaction.vout.every(equalsBase) ||
    item.scriptpubkey_address !== baseAddress

  const getTransactionOtherParts = (direction, transaction) =>
    direction === 'in'
      ? transaction.vin
          .filter((item) => item.prevout.scriptpubkey_address !== baseAddress)
          .reduce((acc, item) => {
            acc.push(item.prevout.scriptpubkey_address)
            return acc
          }, [])
      : transaction.vout.reduce((arr, item) => {
          shouldAddAddressToList(transaction, item) &&
            arr.push(item.scriptpubkey_address)
          return arr
        }, [])

  const parsedTransactions = rawTransactions.map((transaction) => {
    const direction = getDirection(transaction)
    const satoshi = getTransactionAmountInSatoshi(direction, transaction)
    const value = convertSatoshiToBtc(satoshi)
    const date = transaction.status.block_time
    const blockHeight = transaction.status.block_height

    const otherPart = getTransactionOtherParts(direction, transaction)

    return {
      txid: transaction.txid,
      date,
      direction,
      value,
      blockHeight,
      otherPart,
    }
  })

  return parsedTransactions
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
  AVERAGE_MIN_PER_BLOCK,
  MAX_BTC_IN_SATOSHIS,
  MAX_BTC,
}
