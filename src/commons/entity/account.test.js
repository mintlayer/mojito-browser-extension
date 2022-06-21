import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './account'
import { generateKeysFromMnemonic, getAddressFromPubKey } from '../crypto/btc'

test('Account creation and restoring', async () => {
  const pass = 'pass'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const [pubKey] = generateKeysFromMnemonic(mnemonic)
  const originalAddress = getAddressFromPubKey(pubKey)
  const id = await saveAccount('Savings', pass, mnemonic)
  const address = await unlockAccount(id, pass)

  expect(address).toStrictEqual(originalAddress)
})

test('Account creation and restoring - error', async () => {
  const pass = 'pass'
  const wrongPass = 'pasz'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const id = await saveAccount('Savings', pass, mnemonic)

  await expect(async () => {
    await unlockAccount(id, wrongPass)
  }).rejects.toThrowError()
})
