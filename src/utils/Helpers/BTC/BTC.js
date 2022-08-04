import { Electrum } from '@APIs'

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

  const getTransactionOtherParts = (direction, transaction) =>
    direction === 'in'
      ? transaction.vin
          .filter((item) => item.prevout.scriptpubkey_address !== baseAddress)
          .reduce((acc, item) => {
            acc.push(item.prevout.scriptpubkey_address)
            return acc
          }, [])
      : transaction.vout.reduce((arr, item) => {
          if (item.scriptpubkey_address !== baseAddress)
            arr.push(item.scriptpubkey_address)
          else return arr

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

export {
  parseFeesEstimates,
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  getConfirmationsAmount,
  AVERAGE_MIN_PER_BLOCK,
  MAX_BTC_IN_SATOSHIS,
  MAX_BTC,
}
