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

export {
  parseFeesEstimates,
  calculateTransactionSizeInBytes,
  formatBTCValue,
  AVERAGE_MIN_PER_BLOCK,
}
