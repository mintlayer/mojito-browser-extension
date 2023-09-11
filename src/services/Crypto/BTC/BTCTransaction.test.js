import { Electrum } from '@APIs'
import { CoinSelectionAlgo, BTCTransaction } from '@Helpers'

import { buildTransaction } from './BTCTransaction'
import {
  localStorageMock,
  setLocalStorage,
} from 'src/tests/mock/localStorage/localStorage'

jest.setTimeout(30000)
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const mockId = 'networkType'
const mockValue = 'testnet'
setLocalStorage(mockId, mockValue)

test('Build transaction', async () => {
  const from = 'mgLB5u6BG5YTDVkPPjs1rWnZdtb33aDVMT'
  const to = 'mmLMRUn75mM2FC11ETfsZTtsTDUWSNa9q2'
  const amount = 196168
  const feePerBytes = 5
  const fee =
    (BTCTransaction.SIZE_CONSTANTS.overhead +
      BTCTransaction.SIZE_CONSTANTS.output * 2 +
      BTCTransaction.SIZE_CONSTANTS.input * 2) *
    feePerBytes
  const [result] = await buildTransaction({
    from,
    amount,
    fee,
    to,
    wif: 'cTTMFqx7bJSB58TSwXzjSKZaM8frxWZjVzzQfCKCFQaswdzDTFKs',
  })

  const utxos = JSON.parse(await Electrum.getAddressUtxo(from))
  const selected = CoinSelectionAlgo.utxoSelect(utxos, amount + fee)
  const amountUsed = selected.reduce((acc, utxo) => acc + utxo.value, 0)

  expect(result.outs.length).toBe(2)
  expect(result.outs.map((out) => out.value)).toContain(
    amountUsed - amount - fee,
  )
  expect(result.outs.map((out) => out.value)).toContain(amount)
})
