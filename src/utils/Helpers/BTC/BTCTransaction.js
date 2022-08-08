import { BTC, CoinSelectionAlgo } from '@Helpers'
import { Electrum } from '@APIs'

const SIZE_CONSTANTS = {
  overhead: 10,
  input: 148,
  output: 34,
}

const OUTPUT_AMOUNT_DEFAULT = 2

const selectNeededUtxos = async (address, amount, fee) => {
  const utxos = JSON.parse(await Electrum.getAddressUtxo(address))
  return CoinSelectionAlgo.utxoSelect(utxos, amount, fee)
}

const getInputsAmount = async ({ addressFrom, amountToTranfer, fee }) => {
  const inputs = await selectNeededUtxos(addressFrom, amountToTranfer, fee)
  return inputs.length
}

const getOuputsAmount = () => OUTPUT_AMOUNT_DEFAULT

const calculateTransactionSizeInBytes = async ({
  addressFrom,
  amountToTranfer,
  fee,
}) => {
  const inputsSize =
    SIZE_CONSTANTS.input *
    (await getInputsAmount({ addressFrom, amountToTranfer, fee }))
  const ouputsSize = SIZE_CONSTANTS.output * getOuputsAmount()
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
  selectNeededUtxos,
  SIZE_CONSTANTS,
  OUTPUT_AMOUNT_DEFAULT,
}
