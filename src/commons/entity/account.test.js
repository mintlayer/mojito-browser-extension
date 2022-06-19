import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './account'
import { getSeedFromMnemonic } from '../crypto/btc'

test('A', async () => {
  const pass = 'pass'
  const {generateNewAccountMnemonic} = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const originalSeed = getSeedFromMnemonic(mnemonic)
  const id = await saveAccount('Savings', pass, mnemonic)
  const retoredSeed = await unlockAccount(id, pass)

  expect(Buffer.from(retoredSeed)).toStrictEqual(originalSeed)
})
