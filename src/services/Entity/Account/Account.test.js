import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './Account'
import { BTC, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

test('Account creation and restoring', async () => {
  const pass = 'pass'
  const walletType = BTC_ADDRESS_TYPE_MAP[BTC_ADDRESS_TYPE_ENUM.LEGACY]
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const rootWallet = BTC.generateKeysFromMnemonic(mnemonic)
  const derivedWallet = BTC.deriveWallet(
    rootWallet,
    walletType.derivationPath,
    0,
  )
  const originalAddress = walletType.getAddressFromPubKey(
    derivedWallet.publicKey,
  )
  const accountName = 'Savings'
  const id = await saveAccount(
    accountName,
    pass,
    mnemonic,
    BTC_ADDRESS_TYPE_ENUM.LEGACY,
  )
  const { addresses, name } = await unlockAccount(id, pass)

  expect(addresses[0]).toStrictEqual(originalAddress)
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
