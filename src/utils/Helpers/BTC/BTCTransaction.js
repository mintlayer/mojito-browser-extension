import { BTC } from '@Helpers'

const SIZE_CONSTANTS = {
  overhead: 10,
  input: 148,
  output: 34,
}

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
  const inputsSize = SIZE_CONSTANTS.input * getInputsAmount({})
  const ouputsSize = SIZE_CONSTANTS.output * getOuputsAmount({})

  return SIZE_CONSTANTS.overhead + inputsSize + ouputsSize
}

const isValidAmount = (amount) => amount && amount < BTC.MAX_BTC_IN_SATOSHIS

const isTransactionSegwit = (transaction) =>
  transaction.vin.some((vin) => vin.witness && vin.witness.length)

const nonSegwitFilter = (transaction) => !isTransactionSegwit(transaction)

export {
  calculateTransactionSizeInBytes,
  nonSegwitFilter,
  isTransactionSegwit,
  isValidAmount,
}
