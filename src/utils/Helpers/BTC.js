import { Electrum } from '@APIs'

const AVERAGE_MIN_PER_BLOCK = 15

const sizeConstants = {
  overhead: 10,
  input: 148,
  output: 34,
}

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

const formatBTCValue = (value) =>
  value
    .toFixed(8)
    .replace(/\.0+$/, '')
    .replace(/(\.[1-9]+)(0+)$/, '$1')

const getInputsAmount = ({ addressFrom, amountToTranfer }) => {
  // TODO: implement function
  console.log(addressFrom, amountToTranfer)
  return 2
}

const getOuputsAmount = ({ usedUtxos, amountToTranfer }) => {
  // TODO: implement function
  console.log(usedUtxos, amountToTranfer)
  return 2
}

const calculateTransactionSizeInBytes = ({ addressFrom, amountToTranfer }) => {
  const inputsSize = sizeConstants.input * getInputsAmount({})
  const ouputsSize = sizeConstants.output * getOuputsAmount({})

  return sizeConstants.overhead + inputsSize + ouputsSize
}

const convertSatoshiToBtc = (satoshiAmount) => satoshiAmount / 100_000_000

const calculateBalanceFromUtxoList = (list) =>
  list.reduce((accumulator, transaction) => accumulator + transaction.value, 0)

const getConfirmationsAmount = async (transaction) => {
  if (!transaction)
    return new Promise.reject('No transaction to check confirmations.')
  if (!transaction.blockHeight) return Promise.resolve(0)

  const lastBlockHeight = await Electrum.getLastBlockHeight()
  return lastBlockHeight - transaction.blockHeight
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
  calculateTransactionSizeInBytes,
  formatBTCValue,
  AVERAGE_MIN_PER_BLOCK,
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  getConfirmationsAmount,
}
