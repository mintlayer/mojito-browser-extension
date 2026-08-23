import { Cipher, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { LocalStorageService } from '@Storage'
import { IndexedDB } from '@Databases'
import initWasm from 'src/tests/helpers/initWasm'

jest.mock('src/utils/Constants/EnvironmentVars/EnvironmentVars', () => ({
  ...jest.requireActual('src/utils/Constants/EnvironmentVars/EnvironmentVars'),
  USE_WEB_WORKERS: true,
}))

const PASSWORD = 'pass'
const MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const btcOnly = { wallets: ['btc'] }

const handlers = {}

const captureHandler = (name, load) => {
  self.onmessage = undefined
  load()
  handlers[name] = self.onmessage
}

const makeWorker = (handler) => {
  const worker = {
    terminate: jest.fn(),
    postMessage: (message) => {
      const original = globalThis.postMessage
      const restore = () =>
        Object.defineProperty(globalThis, 'postMessage', {
          configurable: true,
          writable: true,
          value: original,
        })

      Object.defineProperty(globalThis, 'postMessage', {
        configurable: true,
        writable: true,
        value: (data) => {
          restore()
          worker.onmessage({ data })
        },
      })

      Promise.resolve(handler({ data: message })).catch(restore)
    },
  }

  return worker
}

let Account

beforeAll(async () => {
  initWasm()

  captureHandler('cipher', () =>
    require('src/services/Crypto/Cipher/Cipher.worker'),
  )
  captureHandler('btc', () => require('src/services/Crypto/BTC/BTC.worker'))

  global.Worker = jest.fn((url) =>
    makeWorker(String(url).includes('BTC') ? handlers.btc : handlers.cipher),
  )

  Account = await import('./Account')
})

afterAll(() => {
  delete global.Worker
})

beforeEach(() => {
  LocalStorageService.setItem('networkType', 'testnet')
})

const createAccount = async (mnemonic = MNEMONIC) =>
  Account.saveAccount({
    name: 'Savings',
    password: PASSWORD,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
  })

const receivingAddressesOf = (addresses) =>
  addresses.btcAddresses.btcReceivingAddresses.map(
    (entry) => Object.keys(entry)[0],
  )

test('worker path - the subroutines really come from the worker module', async () => {
  const loadAccountSubRoutines = (await import('./loadWorkers')).default
  const { encryptSeed } = await loadAccountSubRoutines()
  const workers = await import('./Account.worker')

  expect(encryptSeed).toBe(workers.encryptSeed)
})

test('worker path - an account can be created and unlocked', async () => {
  const id = await createAccount()

  const { addresses, name } = await Account.unlockAccount(id, PASSWORD, btcOnly)

  expect(name).toBe('Savings')
  expect(receivingAddressesOf(addresses).length).toBeGreaterThan(0)
})

test('worker path - a wrong password rejects', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const id = await createAccount()

  await expect(
    Account.unlockAccount(id, 'wrong', btcOnly),
  ).rejects.toBeDefined()

  console.error.mockRestore()
})

test('worker path - additional data really protects the stored blobs', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const id = await createAccount()
  const account = await Account.getAccount(id)

  // The two mintlayer blobs have identical shape, so without the aad binding the
  // swap decrypts cleanly and the unlock succeeds.
  await Account.updateAccount(id, {
    seed: {
      ...account.seed,
      encryptedMlTestnetPrivateKey: account.seed.encryptedMlMainnetPrivateKey,
      encryptedMlMainnetPrivateKey: account.seed.encryptedMlTestnetPrivateKey,
    },
    iv: {
      ...account.iv,
      mlTestnetPrivKeyIv: account.iv.mlMainnetPrivKeyIv,
      mlMainnetPrivKeyIv: account.iv.mlTestnetPrivKeyIv,
    },
    tag: {
      ...account.tag,
      mlTestnetPrivKeyTag: account.tag.mlMainnetPrivKeyTag,
      mlMainnetPrivKeyTag: account.tag.mlTestnetPrivKeyTag,
    },
  })

  await expect(
    Account.unlockAccount(id, PASSWORD, btcOnly),
  ).rejects.toBeDefined()

  console.error.mockRestore()
})

test('worker path - a legacy account migrates to the envelope', async () => {
  const { key, salt } = await Cipher.generatePBKDF2Key({
    password: PASSWORD,
    version: 3,
  })
  const seed = await (
    await import('@Cryptos')
  ).BTC.getSeedFromMnemonic(MNEMONIC)
  const btc = await Cipher.encryptAES({ data: seed, key })
  const ml = await Cipher.encryptAES({ data: 'ml-key', key })

  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: 'Legacy',
    salt,
    encryptionVersion: 3,
    iv: {
      btcIv: btc.iv,
      mlTestnetPrivKeyIv: ml.iv,
      mlMainnetPrivKeyIv: ml.iv,
    },
    tag: {
      btcTag: btc.tag,
      mlTestnetPrivKeyTag: ml.tag,
      mlMainnetPrivKeyTag: ml.tag,
    },
    seed: {
      btcEncryptedSeed: btc.encryptedData,
      encryptedMlTestnetPrivateKey: ml.encryptedData,
      encryptedMlMainnetPrivateKey: ml.encryptedData,
    },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
    htlsSecrets: {},
  })

  await Account.unlockAccount(id, PASSWORD, btcOnly)

  const migrated = await Account.getAccount(id)

  expect(migrated.encryptionVersion).toBe(4)
  expect(migrated.wrappedDek.passkeys).toStrictEqual([])

  await expect(
    Account.unlockAccount(id, PASSWORD, btcOnly),
  ).resolves.toBeDefined()
})

test('worker path - a legacy btc-only account without ml keys still unlocks', async () => {
  const { key, salt } = await Cipher.generatePBKDF2Key({
    password: PASSWORD,
    version: 3,
  })
  const seed = await (
    await import('@Cryptos')
  ).BTC.getSeedFromMnemonic(MNEMONIC)
  const btc = await Cipher.encryptAES({ data: seed, key })

  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: 'BtcOnly',
    salt,
    encryptionVersion: 3,
    iv: { btcIv: btc.iv },
    tag: { btcTag: btc.tag },
    seed: { btcEncryptedSeed: btc.encryptedData },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
    htlsSecrets: {},
  })

  const { addresses } = await Account.unlockAccount(id, PASSWORD, btcOnly)

  expect(receivingAddressesOf(addresses).length).toBeGreaterThan(0)

  const migrated = await Account.getAccount(id)

  expect(migrated.encryptionVersion).toBe(4)
  expect(migrated.seed.encryptedMlTestnetPrivateKey).toBeUndefined()

  await expect(
    Account.unlockAccount(id, PASSWORD, btcOnly),
  ).resolves.toBeDefined()
})
