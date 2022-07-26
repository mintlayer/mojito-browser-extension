import { utxos } from '@TestData'
import {
  utxoSelect,
  nonSegwitFilter,
  isTransactionSegwit,
} from './BTCTransaction'

const orderByDateDesc = (transactionA, transactionB) => {
  if (transactionA.status.block_time > transactionB.status.block_time) return -1
  if (transactionA.status.block_time < transactionB.status.block_time) return 1
  return 0
}

test('Select UTXO', () => {
  const sumAll = (acc, item) => acc + item.value
  const getNewerDate = (acc, item) =>
    acc < item.status.block_time ? item.status.block_time : acc
  const getOlderDate = (acc, item) =>
    !acc || acc > item.status.block_time ? item.status.block_time : acc

  const balance = utxos.reduce(sumAll, 0)
  const targetValue = balance - utxos[0].value - 1
  const selectedTransaction = utxoSelect(utxos, targetValue)
  const orderedUtxo = utxos.sort(orderByDateDesc)

  const newerFromUtxoDate = utxos.reduce(getNewerDate, 0)
  const newerFromSelectedDate = selectedTransaction.reduce(getNewerDate, 0)
  const olderFromUtxoDate = utxos.reduce(getOlderDate, 0)
  const olderFromSelectedDate = selectedTransaction.reduce(getOlderDate, 0)

  expect(selectedTransaction.length).toBe(utxos.length - 1)
  expect(selectedTransaction.reduce(sumAll, 0)).toBeGreaterThan(targetValue)
  expect(newerFromSelectedDate).toBe(newerFromUtxoDate)
  expect(olderFromSelectedDate).toBeGreaterThanOrEqual(olderFromUtxoDate)
  expect(orderedUtxo[orderedUtxo.length - 1].txid).not.toBe(
    selectedTransaction[selectedTransaction.length - 1].txid,
  )
})

test('Select UTXO - not enough funds', () => {
  const sumAll = (acc, item) => acc + item.value

  const balance = utxos.reduce(sumAll, 0)
  const targetValue = balance + 1

  expect(utxoSelect.bind(null, utxos, targetValue)).toThrow()
})

test('Filter non-segwit', () => {
  const result = nonSegwitFilter({
    vin: [{ witness: [] }, { witness: [] }],
  })

  expect(result).toBeTruthy()
})

test('Is Segwit', () => {
  const result = isTransactionSegwit({
    vin: [{ witness: [] }, { witness: [] }],
  })

  expect(result).toBeFalsy()
})
