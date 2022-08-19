import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './Account'
import { BTC } from '@Cryptos'

test('Account creation and restoring', async () => {
  const pass = 'pass'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const [pubKey] = BTC.generateKeysFromMnemonic(mnemonic)
  const originalAddress = BTC.getAddressFromPubKey(pubKey)
  const accountName = 'Savings'
  const id = await saveAccount(accountName, pass, mnemonic)
  const { address, name } = await unlockAccount(id, pass)

  expect(address).toStrictEqual(originalAddress)
  expect(name).toBe(accountName)
})

test('Account creation and restoring - error', async () => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    expect(typeof message).toBe('string')
    console.error.mockRestore()
  })

  const pass = 'pass'
  const wrongPass = 'pasz'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const id = await saveAccount('Savings', pass, mnemonic)

  await expect(async () => {
    await unlockAccount(id, wrongPass)
  }).rejects.toThrowError()
})
