/* eslint-disable no-unused-vars */
import loadAccountSubRoutines from './loadWorkers'
// import { saveAccount, unlockAccount } from './Account'
// import { BTC, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { IndexedDB } from '@Databases'
import { LocalStorageService } from '@Storage'
import * as Passkey from '../../Crypto/Passkey/Passkey'
import {
  enrollPasskey,
  removePasskey,
  getPasskeyBlob,
  unlockAccountWithPasskey,
} from './Account'

// TODO: The tests had been disabled to avoid the error from wasm-crypto on the JEST environment, need to be fixed later

jest.mock('@Databases', () => ({
  IndexedDB: {
    loadAccounts: jest.fn(),
    save: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    deleteAccount: jest.fn(),
  },
}))

jest.mock('@Storage', () => ({
  LocalStorageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}))

jest.mock('./loadWorkers', () => {
  const generateNewAccountMnemonic = jest.fn()
  const generateSeed = jest.fn()
  const generateEncryptionKey = jest.fn()
  const encryptSeed = jest.fn()
  const decryptSeed = jest.fn()
  const loadAccountSubRoutines = jest.fn(async () => ({
    generateNewAccountMnemonic,
    generateSeed,
    generateEncryptionKey,
    encryptSeed,
    decryptSeed,
  }))
  return { __esModule: true, default: loadAccountSubRoutines }
})

jest.mock('../../Crypto/Passkey/Passkey', () => ({
  isSupported: jest.fn(),
  enrollPasskeyCredential: jest.fn(),
  unlockPasswordWithPasskey: jest.fn(),
}))

jest.mock('../../Crypto/Cipher/Cipher', () => ({
  CURRENT_ENCRYPTION_VERSION: 2,
}))

jest.mock('./AccountHelpers', () => ({
  getEncryptedPrivateKeys: jest.fn(),
  getEncryptedHtlsSecret: jest.fn(),
}))

jest.mock('@Cryptos', () => ({
  BTC: { getHDWalletFromSeed: jest.fn() },
  ML: { getWalletAddresses: jest.fn(), getPrivateKeyFromMnemonic: jest.fn() },
  BTC_ADDRESS_TYPE_MAP: {},
  BTC_ADDRESS_TYPE_ENUM: { LEGACY: 'legacy', NATIVE_SEGWIT: 'nativeSegWit' },
}))

jest.mock('@Helpers', () => ({
  BTC: { getNetwork: jest.fn(), getBtcAddresses: jest.fn() },
}))

jest.mock('@Constants', () => ({
  AppInfo: {
    DEFAULT_WALLETS_TO_CREATE: [],
    BTC_DEFAULT_ADDRESSES_BATCH: 10,
    DEFAULT_ML_WALLET_OFFSET: 0,
    NETWORK_TYPES: { TESTNET: 'testnet', MAINNET: 'mainnet' },
  },
}))

const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const accountName = 'Savings'
const password = 'pass'
const defaultWalletsToCreate = ['btc']
// const customWalletsToCreate2 = ['btc', 'ml']

// test('Account creation and restoring', async () => {
//   const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
//   const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
//   const [pubKey] = BTC.generateKeysFromMnemonic(mnemonic)
//   const originalAddress =
//     BTC_ADDRESS_TYPE_MAP[BTC_ADDRESS_TYPE_ENUM.LEGACY].getAddressFromPubKey(
//       pubKey,
//     )
//   const data = {
//     name: accountName,
//     password,
//     mnemonic,
//     walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
//     walletsToCreate: defaultWalletsToCreate,
//   }
//   const id = await saveAccount(data)
//   const { addresses, name } = await unlockAccount(id, password)

//   expect(addresses.btcMainnetAddress).toStrictEqual(originalAddress)
//   expect(name).toBe(accountName)
// })

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
  // const id = await saveAccount(data)

  // await expect(async () => {
  //   await unlockAccount(id, wrongPass)
  // }).rejects.toThrow()
})

// test('Accouts wallets to create - default', async () => {
//   const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
//   const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
//   const data = {
//     name: accountName,
//     password,
//     mnemonic,
//     walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
//   }
//   const id = await saveAccount(data)
//   const { addresses } = await unlockAccount(id, password)

//   expect(addresses.btcMainnetAddress).toBeDefined()
//   expect(addresses.btcTestnetAddress).toBeDefined()
// })

// test('Accouts wallets to create - custom', async () => {
//   const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
//   const mnemonic = await generateNewAccountMnemonic(ENTROPY_DATA)
//   const data = {
//     name: accountName,
//     password,
//     mnemonic,
//     walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
//     walletsToCreate: customWalletsToCreate2,
//   }
//   const id = await saveAccount(data)
//   const { addresses } = await unlockAccount(id, password)

//   expect(addresses.btcMainnetAddress).toBeDefined()
//   expect(addresses.btcTestnetAddress).toBeDefined()
//   expect(addresses.mlMainnetAddress).toBeDefined()
//   expect(addresses.mlTestnetAddress).toBeDefined()
// })

// ── Passkey management (enroll / remove / blob / unlock with passkey) ─────

const accountId = 'account-1'
const unwrappedPassword = 'unwrapped-pass'

const baseAccount = {
  id: accountId,
  name: accountName,
  salt: 'salt-123',
  encryptionVersion: 2,
  iv: {
    btcIv: 'iv-btc',
    mlTestnetPrivKeyIv: 'iv-ml-test',
    mlMainnetPrivKeyIv: 'iv-ml-main',
  },
  tag: {
    btcTag: 'tag-btc',
    mlTestnetPrivKeyTag: 'tag-ml-test',
    mlMainnetPrivKeyTag: 'tag-ml-main',
  },
  seed: {
    btcEncryptedSeed: 'enc-btc-seed',
    encryptedMlTestnetPrivateKey: 'enc-ml-test',
    encryptedMlMainnetPrivateKey: 'enc-ml-main',
  },
  walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
  walletsToCreate: defaultWalletsToCreate,
  htlsSecrets: {},
}

const passkeyBlob = {
  credentialId: 'cred-base64',
  salt: 'salt-base64',
  iv: 'iv-base64',
  ciphertext: 'cipher-base64',
}

// in-memory stand-in for IndexedDB so getAccount/updateAccount behave like the
// real storage layer (reads see what writes persisted)
let dbAccounts

const seedDb = (accounts) => {
  dbAccounts = accounts.map((account) => ({ ...account }))
  IndexedDB.loadAccounts.mockImplementation(async () => dbAccounts)
}

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('Account passkey management', () => {
  let generateEncryptionKey
  let decryptSeed

  beforeEach(async () => {
    jest.clearAllMocks()

    seedDb([{ ...baseAccount }])
    IndexedDB.get.mockImplementation(async (accounts, id) =>
      accounts.find((account) => account.id === id),
    )
    IndexedDB.update.mockImplementation(async (accounts, entity) => {
      const index = accounts.findIndex((account) => account.id === entity.id)
      if (index === -1) accounts.push(entity)
      else accounts[index] = entity
    })

    LocalStorageService.getItem.mockReturnValue(undefined)

    const subroutines = await loadAccountSubRoutines()
    generateEncryptionKey = subroutines.generateEncryptionKey
    decryptSeed = subroutines.decryptSeed
    generateEncryptionKey.mockResolvedValue({ key: 'fake-key' })
    decryptSeed.mockResolvedValue('decrypted-secret')
  })

  describe('enrollPasskey', () => {
    it('verifies the password, enrolls the credential and persists the blob', async () => {
      Passkey.enrollPasskeyCredential.mockResolvedValue(passkeyBlob)

      const result = await enrollPasskey(accountId, password)
      // updateAccount is fire-and-forget inside enrollPasskey — let it settle
      await flushPromises()

      expect(result).toBe(passkeyBlob)
      expect(Passkey.enrollPasskeyCredential).toHaveBeenCalledTimes(1)
      expect(Passkey.enrollPasskeyCredential).toHaveBeenCalledWith(password)

      // the password is verified first (unlockAccount with id + password)
      expect(generateEncryptionKey).toHaveBeenCalledWith({
        password,
        salt: baseAccount.salt,
        version: baseAccount.encryptionVersion,
      })
      expect(generateEncryptionKey.mock.invocationCallOrder[0]).toBeLessThan(
        Passkey.enrollPasskeyCredential.mock.invocationCallOrder[0],
      )

      // blob persisted on the account through updateAccount
      expect(IndexedDB.update).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ id: accountId, passkeyBlob }),
      )
      expect(await getPasskeyBlob(accountId)).toBe(passkeyBlob)
    })

    it('rejects and stores nothing when the password is wrong', async () => {
      decryptSeed.mockResolvedValue({ error: 'decryption failed' })
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      await expect(
        enrollPasskey(accountId, 'wrong-password'),
      ).rejects.toBeDefined()
      await flushPromises()

      expect(Passkey.enrollPasskeyCredential).not.toHaveBeenCalled()
      expect(IndexedDB.update).not.toHaveBeenCalled()
      expect(dbAccounts[0].passkeyBlob).toBeUndefined()

      consoleErrorSpy.mockRestore()
    })
  })

  describe('removePasskey', () => {
    it('verifies the password and clears the stored blob', async () => {
      seedDb([{ ...baseAccount, passkeyBlob }])

      await removePasskey(accountId, password)
      await flushPromises()

      // password verified through unlockAccount before clearing
      expect(generateEncryptionKey).toHaveBeenCalledWith({
        password,
        salt: baseAccount.salt,
        version: baseAccount.encryptionVersion,
      })
      expect(IndexedDB.update).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ id: accountId, passkeyBlob: null }),
      )
      expect(await getPasskeyBlob(accountId)).toBeNull()
      expect(Passkey.enrollPasskeyCredential).not.toHaveBeenCalled()
      expect(Passkey.unlockPasswordWithPasskey).not.toHaveBeenCalled()
    })
  })

  describe('getPasskeyBlob', () => {
    it('returns the stored blob', async () => {
      seedDb([{ ...baseAccount, passkeyBlob }])

      expect(await getPasskeyBlob(accountId)).toBe(passkeyBlob)
    })

    it('returns null when no passkey is enrolled', async () => {
      expect(await getPasskeyBlob(accountId)).toBeNull()
    })
  })

  describe('unlockAccountWithPasskey', () => {
    it('unwraps the password, unlocks the account and returns its result', async () => {
      seedDb([{ ...baseAccount, passkeyBlob }])
      Passkey.unlockPasswordWithPasskey.mockResolvedValue(unwrappedPassword)

      const result = await unlockAccountWithPasskey(accountId, { wallets: [] })

      expect(Passkey.unlockPasswordWithPasskey).toHaveBeenCalledTimes(1)
      expect(Passkey.unlockPasswordWithPasskey).toHaveBeenCalledWith(
        passkeyBlob,
      )

      // the unwrapped password (not the raw one) is used to unlock
      expect(generateEncryptionKey).toHaveBeenCalledWith({
        password: unwrappedPassword,
        salt: baseAccount.salt,
        version: baseAccount.encryptionVersion,
      })
      expect(generateEncryptionKey).not.toHaveBeenCalledWith({
        password,
        salt: baseAccount.salt,
        version: baseAccount.encryptionVersion,
      })

      // same shape the password path returns
      expect(result).toEqual({
        addresses: {},
        btcPrivateKeys: { btcHDWallet: null, btcAddressData: null },
        name: accountName,
        mlPrivKeys: {
          mlMainnetPrivateKey: 'decrypted-secret',
          mlTestnetPrivateKey: 'decrypted-secret',
        },
      })
    })

    it('rejects with PASSKEY_NOT_ENROLLED and never unlocks when no blob is stored', async () => {
      await expect(
        unlockAccountWithPasskey(accountId, { wallets: [] }),
      ).rejects.toThrow('PASSKEY_NOT_ENROLLED')

      expect(Passkey.unlockPasswordWithPasskey).not.toHaveBeenCalled()
      // unlockAccount is never invoked (its first statement reads storage
      // through LocalStorageService; the crypto subroutines are only ever
      // reached from inside unlockAccount)
      expect(LocalStorageService.getItem).not.toHaveBeenCalled()
      expect(generateEncryptionKey).not.toHaveBeenCalled()
      expect(decryptSeed).not.toHaveBeenCalled()
      expect(IndexedDB.update).not.toHaveBeenCalled()
    })
  })
})
