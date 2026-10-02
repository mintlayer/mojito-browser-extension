import { BTC, ML, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { IndexedDB } from '@Databases'
import { AppInfo } from '@Constants'
import {
  getEncryptedPrivateKeys,
  getEncryptedHtlsSecret,
} from './AccountHelpers'
import { BTC as BtcHelpers } from '@Helpers'
import loadAccountSubRoutines from './loadWorkers'
import NetworkTypeEntity from '../NetworkType/NetworkType'
import { CURRENT_ENCRYPTION_VERSION } from '../../Crypto/Cipher/Cipher'
import * as Passkey from '../../Crypto/Passkey/Passkey'

const getAccountVersion = (account) => account.encryptionVersion || 1

const saveAccount = async (data) => {
  const { name, password, mnemonic, walletType, walletsToCreate } = data
  const {
    salt,
    encryptedMlTestnetPrivateKey,
    encryptedMlMainnetPrivateKey,
    btcEncryptedSeed,
    mlTestnetPrivKeyIv,
    mlMainnetPrivKeyIv,
    btcIv,
    mlTestnetPrivKeyTag,
    mlMainnetPrivKeyTag,
    btcTag,
  } = await getEncryptedPrivateKeys(password, undefined, mnemonic)

  const account = {
    name,
    salt,
    encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    iv: { btcIv, mlTestnetPrivKeyIv, mlMainnetPrivKeyIv },
    tag: { btcTag, mlTestnetPrivKeyTag, mlMainnetPrivKeyTag },
    seed: {
      btcEncryptedSeed,
      encryptedMlTestnetPrivateKey,
      encryptedMlMainnetPrivateKey,
    },
    walletType,
    walletsToCreate,
    htlsSecrets: {},
  }

  const accounts = await IndexedDB.loadAccounts()
  return await IndexedDB.save(accounts, account)
}

const getAccount = async (id) => {
  const accounts = await IndexedDB.loadAccounts()
  return IndexedDB.get(accounts, id)
}

const updateAccount = async (id, updates) => {
  const accounts = await IndexedDB.loadAccounts()
  const account = await IndexedDB.get(accounts, id)
  const updatedAccount = { ...account, ...updates }

  await IndexedDB.update(accounts, updatedAccount)

  return updatedAccount
}

const deleteAccount = async (id) => {
  await IndexedDB.deleteAccount(id)
}

const backupAccountToJSON = async (account) => {
  const record = await getAccount(account.id)
  if (!record)
    throw new Error('Failed to export account: account data could not be read.')

  // Never export an account still on legacy KDF parameters: the backup file
  // outlives the wallet, and a pre-V3 record (PBKDF2-SHA512 10k / AES-128)
  // stays offline-brute-forceable forever. Unlocking once migrates the
  // record to the current version.
  if (getAccountVersion(record) < CURRENT_ENCRYPTION_VERSION) {
    throw Object.assign(
      new Error(
        'This account still uses outdated encryption. Unlock the wallet once (make any transaction or log out and back in) to upgrade it, then back up again.',
      ),
      { code: 'ENCRYPTION_OUTDATED' },
    )
  }

  const accountJson = await IndexedDB.getAccountJSON(account.id)
  if (!accountJson)
    throw new Error('Failed to export account: account data could not be read.')
  const blob = new Blob([accountJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mojito_${account.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const restoreAccountFromJSON = async (json) => {
  await IndexedDB.restoreAccountFromJSON(json)
}

const checkPasswordValidity = async (id, password) => {
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()
  try {
    const account = await getAccount(id)
    if (!account?.salt || !account?.seed?.btcEncryptedSeed) return false

    const { key } = await generateEncryptionKey({
      password,
      salt: account.salt,
      version: getAccountVersion(account),
    })

    const decrypted = await decryptSeed({
      data: account.seed.btcEncryptedSeed,
      iv: account.iv.btcIv,
      tag: account.tag.btcTag,
      key,
    })

    if (!decrypted || decrypted.error) return false
    return true
  } catch {
    return false
  }
}

const unlockHtlsSecret = async ({ accountId, password, hash }) => {
  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()
  const account = await getAccount(accountId)
  const isPasswordValid = await checkPasswordValidity(accountId, password)
  if (!isPasswordValid) return Promise.reject('Invalid password')
  if (!account) return Promise.reject('Account not found')
  if (!account.htlsSecrets || !account.htlsSecrets[hash])
    return Promise.reject('No secret found for the provided hash')

  const { key } = await generateEncryptionKey({
    password,
    salt: account.salt,
    version: getAccountVersion(account),
  })

  const data = account.htlsSecrets[hash]
  const decrypted = await decryptSeed({
    data: data.encryptedHtlsSecret,
    iv: data.htlsIv,
    tag: data.htlsTag,
    key,
  })

  if (!decrypted || decrypted.error)
    return Promise.reject(
      'Failed to decrypt the secret. Possibly wrong password.',
    )

  return new TextDecoder().decode(decrypted)
}

const saveProvidedHtlsSecret = async ({ accountId, password, data }) => {
  const account = await getAccount(accountId)
  const isPasswordValid = await checkPasswordValidity(accountId, password)
  if (!isPasswordValid) return Promise.reject('Invalid password')
  if (!account) return Promise.reject('Account not found')

  const { encryptedHtlsSecret, htlsIv, htlsTag } = await getEncryptedHtlsSecret(
    password,
    account.salt,
    data.secret,
    getAccountVersion(account),
  )

  const updatedHtlsSecrets = {
    ...account.htlsSecrets,
    [data.hash]: { encryptedHtlsSecret, htlsIv, htlsTag, txHash: data.txHash },
  }

  await updateAccount(accountId, { htlsSecrets: updatedHtlsSecrets })
}

const reEncryptAccount = async (id, password, account, decryptedSeeds) => {
  const { generateEncryptionKey, encryptSeed, decryptSeed } =
    await loadAccountSubRoutines()

  const { key: newKey, salt: newSalt } = await generateEncryptionKey({
    password,
    version: CURRENT_ENCRYPTION_VERSION,
  })

  const reEncrypt = async (data) => {
    const { encryptedData, iv, tag } = await encryptSeed({ data, key: newKey })
    return { encryptedData, iv, tag }
  }

  const {
    encryptedData: btcEncryptedSeed,
    iv: btcIv,
    tag: btcTag,
  } = await reEncrypt(decryptedSeeds.seed)

  const {
    encryptedData: encryptedMlTestnetPrivateKey,
    iv: mlTestnetPrivKeyIv,
    tag: mlTestnetPrivKeyTag,
  } = await reEncrypt(decryptedSeeds.mlTestnetPrivateKey)

  const {
    encryptedData: encryptedMlMainnetPrivateKey,
    iv: mlMainnetPrivKeyIv,
    tag: mlMainnetPrivKeyTag,
  } = await reEncrypt(decryptedSeeds.mlMainnetPrivateKey)

  // Re-encrypt HTLS secrets if any
  const updatedHtlsSecrets = {}
  if (account.htlsSecrets) {
    const { key: oldKey } = await generateEncryptionKey({
      password,
      salt: account.salt,
      version: getAccountVersion(account),
    })

    for (const [hash, data] of Object.entries(account.htlsSecrets)) {
      const decryptedSecret = await decryptSeed({
        data: data.encryptedHtlsSecret,
        iv: data.htlsIv,
        tag: data.htlsTag,
        key: oldKey,
      })
      const {
        encryptedData: encryptedHtlsSecret,
        iv: htlsIv,
        tag: htlsTag,
      } = await reEncrypt(decryptedSecret)
      updatedHtlsSecrets[hash] = {
        encryptedHtlsSecret,
        htlsIv,
        htlsTag,
        txHash: data.txHash,
      }
    }
  }

  await updateAccount(id, {
    salt: newSalt,
    encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    iv: { btcIv, mlTestnetPrivKeyIv, mlMainnetPrivKeyIv },
    tag: { btcTag, mlTestnetPrivKeyTag, mlMainnetPrivKeyTag },
    seed: {
      btcEncryptedSeed,
      encryptedMlTestnetPrivateKey,
      encryptedMlMainnetPrivateKey,
    },
    htlsSecrets: updatedHtlsSecrets,
  })
}

const unlockAccount = async (id, password, { wallets } = {}) => {
  // Same lookup (and mainnet default) the rest of the app uses, so a
  // missing storage key can no longer skip both network branches below.
  const networkType = NetworkTypeEntity.get()

  const { generateEncryptionKey, decryptSeed } = await loadAccountSubRoutines()
  const addresses = {}

  try {
    const account = await getAccount(id)

    if (!account.walletsToCreate)
      updateAccount(id, {
        walletsToCreate: AppInfo.DEFAULT_WALLETS_TO_CREATE,
      }).catch((migrationError) =>
        console.error(
          'Failed to persist walletsToCreate on the account:',
          migrationError,
        ),
      )

    const accountVersion = getAccountVersion(account)

    const { key } = await generateEncryptionKey({
      password,
      salt: account.salt,
      version: accountVersion,
    })

    const seed = await decryptSeed({
      data: account.seed.btcEncryptedSeed,
      iv: account.iv.btcIv,
      tag: account.tag.btcTag,
      key,
    }).catch((decryptError) => {
      console.error(
        '[Account] decryptSeed failed — password/key mismatch or corrupted data:',
        decryptError,
      )
      throw decryptError
    })

    const mlTestnetPrivateKey = await decryptSeed({
      data: account.seed.encryptedMlTestnetPrivateKey,
      iv: account.iv.mlTestnetPrivKeyIv,
      tag: account.tag.mlTestnetPrivKeyTag,
      key,
    })

    const mlMainnetPrivateKey = await decryptSeed({
      data: account.seed.encryptedMlMainnetPrivateKey,
      iv: account.iv.mlMainnetPrivKeyIv,
      tag: account.tag.mlMainnetPrivKeyTag,
      key,
    })
    // this error just exists if the jobe was run in a worker
    /* istanbul ignore next */
    const btcAddressType =
      account.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
    if (seed.error) throw new Error(seed.error)

    const walletsToUnlock =
      wallets || account.walletsToCreate || AppInfo.DEFAULT_WALLETS_TO_CREATE

    let btcHDWallet = null
    let btcAddressData = null
    if (walletsToUnlock.includes('btc')) {
      btcHDWallet = BTC.getHDWalletFromSeed(Buffer.from(seed))
      btcAddressData = await BTC_ADDRESS_TYPE_MAP[btcAddressType].getAddresses(
        btcHDWallet,
        BtcHelpers.getNetwork(),
        AppInfo.BTC_DEFAULT_ADDRESSES_BATCH,
        btcAddressType,
      )
      const btcAddresses = BtcHelpers.getBtcAddresses(btcAddressData)
      addresses.btcAddresses = btcAddresses
    }

    if (walletsToUnlock.includes('ml')) {
      if (networkType === AppInfo.NETWORK_TYPES.TESTNET) {
        const mlTestnetWalletAddresses = await ML.getWalletAddresses(
          mlTestnetPrivateKey,
          AppInfo.NETWORK_TYPES.TESTNET,
          AppInfo.DEFAULT_ML_WALLET_OFFSET,
        )
        addresses.mlAddresses = mlTestnetWalletAddresses
      }

      if (networkType === AppInfo.NETWORK_TYPES.MAINNET) {
        const mlMainnetWalletAddresses = await ML.getWalletAddresses(
          mlMainnetPrivateKey,
          AppInfo.NETWORK_TYPES.MAINNET,
          AppInfo.DEFAULT_ML_WALLET_OFFSET,
        )
        addresses.mlAddresses = mlMainnetWalletAddresses
      }
    }

    // Migrate old accounts to current encryption version in the background
    if (accountVersion !== CURRENT_ENCRYPTION_VERSION) {
      reEncryptAccount(id, password, account, {
        seed,
        mlTestnetPrivateKey,
        mlMainnetPrivateKey,
      }).catch((e) => console.error('Encryption migration failed:', e))
    }

    return {
      addresses,
      btcPrivateKeys: { btcHDWallet, btcAddressData },
      name: account.name,
      mlPrivKeys: { mlMainnetPrivateKey, mlTestnetPrivateKey },
    }
  } catch (e) {
    console.error(e)
    return Promise.reject({
      addresses: {},
      btcPrivateKeys: { btcHDWallet: null, btcAddressData: null },
      name: '',
      mlPrivKeys: { mlMainnetPrivateKey: '', mlTestnetPrivateKey: '' },
      error: e?.message ?? String(e),
    })
  }
}

// ── Passkey unlock (Chromium only; password remains the fallback) ────────
// SECURITY: the passkey wraps the account password via the WebAuthn PRF
// extension — the wrapped blob is stored on the account, the PRF secret
// never leaves memory, and the password itself is never persisted. Enroll
// and remove both verify the password first.

const enrollPasskey = async (id, password) => {
  // verify the password by unlocking before binding the passkey to it
  // (wallets: [] → verification only, no address derivation)
  await unlockAccount(id, password, { wallets: [] })
  const blob = await Passkey.enrollPasskeyCredential(password)
  await updateAccount(id, { passkeyBlob: blob })
  return blob
}

const removePasskey = async (id, password) => {
  await unlockAccount(id, password, { wallets: [] })
  await updateAccount(id, { passkeyBlob: null })
}

const getPasskeyBlob = async (id) => {
  const account = await getAccount(id)
  return account?.passkeyBlob ?? null
}

const hasPasskey = async (id) => Boolean(await getPasskeyBlob(id))

// Evaluates the PRF secret and returns the account password IN MEMORY ONLY
// (identical trust level to the user typing it). Never persisted anywhere.
const getPasswordWithPasskey = async (id) => {
  const blob = await getPasskeyBlob(id)
  if (!blob) throw new Error('PASSKEY_NOT_ENROLLED')
  return Passkey.unwrapPasswordWithPasskey(blob)
}

// Unlocks with the passkey-wrapped password: returns the same unlocked
// account the password path returns.
const unlockAccountWithPasskey = async (id, { wallets } = {}) => {
  const blob = await getPasskeyBlob(id)
  if (!blob) throw new Error('PASSKEY_NOT_ENROLLED')
  const password = await Passkey.unwrapPasswordWithPasskey(blob)
  return unlockAccount(id, password, { wallets })
}

export {
  saveAccount,
  unlockAccount,
  enrollPasskey,
  removePasskey,
  getPasskeyBlob,
  hasPasskey,
  getPasswordWithPasskey,
  unlockAccountWithPasskey,
  updateAccount,
  getAccount,
  deleteAccount,
  backupAccountToJSON,
  restoreAccountFromJSON,
  unlockHtlsSecret,
  saveProvidedHtlsSecret,
  checkPasswordValidity,
}
