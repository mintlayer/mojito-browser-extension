import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './Account'
import { BTC, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

test('Account creation and restoring', async () => {
  const pass = 'pass'
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
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
  const { addresses, name } = await unlockAccount(
    id,
    pass,
    BTC_ADDRESS_TYPE_ENUM.LEGACY,
  )

  expect(addresses.btcMainnetAddress).toStrictEqual(originalAddress)
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
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
  const id = await saveAccount('Savings', pass, mnemonic)

  await expect(async () => {
    await unlockAccount(id, wrongPass)
  }).rejects.toThrowError()
})
