import { Electrum } from '@APIs'
import { CoinSelectionAlgo, BTCTransaction } from '@Helpers'

import { buildTransaction } from './BTCTransaction'
import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

import { LocalStorageService } from '@Storage'

jest.setTimeout(30000)
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const mockId = 'networkType'
const mockValue = 'testnet'
LocalStorageService.setItem(mockId, mockValue)

test('Build transaction', async () => {
  const from = 'tb1qcwuha0qk0fyjdqn74x3gf3ytwsw8net52j0zt6'
  const to = 'tb1q0n9phs2dqy3fp20w2k990ck6v9syzr4n57k94s'
  const amount = 196168
  const feePerBytes = 5
  const fee =
    (BTCTransaction.SIZE_CONSTANTS.overhead +
      BTCTransaction.SIZE_CONSTANTS.output * 2 +
      BTCTransaction.SIZE_CONSTANTS.input * 2) *
    feePerBytes
  const wif = 'cVbL6DU4SkUffGYshdcvz7AEDzUYiy7McLY4VvSD4XLKEF87EEXj'
  const [result] = await buildTransaction({
    to,
    amount,
    fee,
    wif,
    from,
  })

  const utxos = JSON.parse(await Electrum.getAddressUtxo(from))
  const selected = CoinSelectionAlgo.utxoSelect(utxos, amount, fee)
  const amountUsed = selected.reduce((acc, utxo) => acc + utxo.value, 0)

  expect(result.outs.length).toBe(2)
  expect(result.outs.map((out) => out.value)).toContain(
    amountUsed - amount - fee,
  )
  expect(result.outs.map((out) => out.value)).toContain(amount)
})
