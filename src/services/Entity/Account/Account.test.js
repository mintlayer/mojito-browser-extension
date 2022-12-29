import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './Account'
import { BTC, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

test('Account creation and restoring', async () => {
  const pass = 'pass'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic()
  const [pubKey] = BTC.generateKeysFromMnemonic(mnemonic)
  const originalAddress =
    BTC_ADDRESS_TYPE_MAP[BTC_ADDRESS_TYPE_ENUM.LEGACY].getAddressFromPubKey(
      pubKey,
    )
  const accountName = 'Savings'
  const id = await saveAccount(
    accountName,
    pass,
    mnemonic,
    BTC_ADDRESS_TYPE_ENUM.LEGACY,
  )
  const { address, name } = await unlockAccount(
    id,
    pass,
    BTC_ADDRESS_TYPE_ENUM.LEGACY,
  )

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
