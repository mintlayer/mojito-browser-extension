import { Electrum } from '@APIs'
import { BTCTransaction } from '@Helpers'

import { buildTransaction } from './BTCTransaction'

test('Build transaction', async () => {
  const from = 'mgLB5u6BG5YTDVkPPjs1rWnZdtb33aDVMT'
  const to = 'mmLMRUn75mM2FC11ETfsZTtsTDUWSNa9q2'
  const amount = 196168
  const fee = 373
  const result = await buildTransaction({
    from,
    amount,
    fee,
    to,
    wif: 'cTTMFqx7bJSB58TSwXzjSKZaM8frxWZjVzzQfCKCFQaswdzDTFKs',
  })

  const utxos = JSON.parse(await Electrum.getAddressUtxo(from))
  const selected = BTCTransaction.utxoSelect(utxos, amount + fee)
  const amountUsed = selected.reduce((acc, utxo) => acc + utxo.value, 0)

  expect(result.outs.length).toBe(2)
  expect(result.outs.map((out) => out.value)).toContain(
    amountUsed - amount - fee,
  )
  expect(result.outs.map((out) => out.value)).toContain(amount)
})
