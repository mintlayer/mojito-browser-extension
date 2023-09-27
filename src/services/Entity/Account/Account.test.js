import loadAccountSubRoutines from './loadWorkers'
import { saveAccount, unlockAccount } from './Account'
import { BTC, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const accountName = 'Savings'
const password = 'pass'
const defaultWalletsToCreate = ['btc']
const customWalletsToCreate2 = ['btc', 'ml']

test('Account creation and restoring', async () => {
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
  const [pubKey] = BTC.generateKeysFromMnemonic(mnemonic)
  const originalAddress =
    BTC_ADDRESS_TYPE_MAP[BTC_ADDRESS_TYPE_ENUM.LEGACY].getAddressFromPubKey(
      pubKey,
    )
  const data = {
    name: accountName,
    password,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
  }
  const id = await saveAccount(data)
  const { addresses, name } = await unlockAccount(id, password)

  expect(addresses.btcMainnetAddress).toStrictEqual(originalAddress)
  expect(name).toBe(accountName)
})

test('Account creation and restoring - error', async () => {
  jest.spyOn(console, 'error').mockImplementation((message) => {
    expect(typeof message).toBe('string')
    console.error.mockRestore()
  })
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)

  const data = {
    name: accountName,
    password,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
  }
  const wrongPass = 'pasz'
  const id = await saveAccount(data)

  await expect(async () => {
    await unlockAccount(id, wrongPass)
  }).rejects.toThrowError()
})

test('Accouts wallets to create - default', async () => {
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
  const data = {
    name: accountName,
    password,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
  }
  const id = await saveAccount(data)
  const { addresses } = await unlockAccount(id, password)

  expect(addresses.btcMainnetAddress).toBeDefined()
  expect(addresses.btcTestnetAddress).toBeDefined()
})

test('Accouts wallets to create - custom', async () => {
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
  const data = {
    name: accountName,
    password,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: customWalletsToCreate2,
  }
  const id = await saveAccount(data)
  const { addresses } = await unlockAccount(id, password)

  expect(addresses.btcMainnetAddress).toBeDefined()
  expect(addresses.btcTestnetAddress).toBeDefined()
  expect(addresses.mlMainnetAddress).toBeDefined()
  expect(addresses.mlTestnetAddress).toBeDefined()
})
