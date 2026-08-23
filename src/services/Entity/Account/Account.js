import { BTC, ML, BTC_ADDRESS_TYPE_MAP, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { IndexedDB } from '@Databases'
import { AppInfo } from '@Constants'
import * as Passkey from 'src/services/Crypto/Passkey/Passkey'
import {
  getEnvelopeEncryptedPrivateKeys,
  buildPasskeyWrapper,
  getEncryptedHtlsSecret,
} from './AccountHelpers'
import { BTC as BtcHelpers } from '@Helpers'
import loadAccountSubRoutines from './loadWorkers'
import { LocalStorageService } from '@Storage'
import {
  CURRENT_ENCRYPTION_VERSION,
  ENVELOPE_ENCRYPTION_VERSION,
  generateDek,
  wrapDek,
  unwrapDek,
  deriveKekFromPrf,
  contentAad,
  wrapperAad,
  htlsAad,
} from 'src/services/Crypto/Cipher/Cipher'

const getAccountVersion = (account) => account.encryptionVersion || 1

const accountLocks = new Map()

const withAccountLock = (id, task) => {
  const previous = accountLocks.get(id) ?? Promise.resolve()
  const next = previous.then(task, task)

  accountLocks.set(
    id,
    next.catch(() => {}),
  )

  return next
}

const isEnvelope = (version) => version >= ENVELOPE_ENCRYPTION_VERSION

const aadFor = (account, aad) =>
  isEnvelope(getAccountVersion(account)) ? aad : undefined

const PASSWORD_CREDENTIAL = 'password'
const PASSKEY_CREDENTIAL = 'passkey'

const toCredential = (credential) =>
  typeof credential === 'string'
    ? { kind: PASSWORD_CREDENTIAL, password: credential }
    : credential

const getWrapper = (account, credential) => {
  if (credential.kind === PASSWORD_CREDENTIAL)
    return account.wrappedDek?.password

  return account.wrappedDek?.passkeys?.find(
    (entry) => entry.credentialId === credential.credentialId,
  )
}

const getWrappingKey = async (account, credential) => {
  if (credential.kind === PASSKEY_CREDENTIAL)
    return deriveKekFromPrf(credential.prfOutput)

  const { generateEncryptionKey } = await loadAccountSubRoutines()
  const { key } = await generateEncryptionKey({
    password: credential.password,
    salt: account.salt,
    version: getAccountVersion(account),
  })

  return key
}

const getContentKey = async (account, credential) => {
  const unlock = toCredential(credential)
  const version = getAccountVersion(account)

  if (!isEnvelope(version)) {
    if (unlock.kind !== PASSWORD_CREDENTIAL)
      throw new Error('This account can only be unlocked with a password')

    return getWrappingKey(account, unlock)
  }

  const wrapper = getWrapper(account, unlock)
  const wrappingKey = await getWrappingKey(account, unlock)
  const wrapperId =
    unlock.kind === PASSWORD_CREDENTIAL
      ? PASSWORD_CREDENTIAL
      : unlock.credentialId

  return unwrapDek({
    data: wrapper?.encryptedData,
    iv: wrapper?.iv,
    tag: wrapper?.tag,
    wrappingKey,
    aad: wrapperAad(wrapperId),
  })
}

const saveAccount = async (data) => {
  const { name, password, mnemonic, walletType, walletsToCreate } = data
  const {
    salt,
    encryptionVersion,
    wrappedDek,
    encryptedMlTestnetPrivateKey,
    encryptedMlMainnetPrivateKey,
    btcEncryptedSeed,
    mlTestnetPrivKeyIv,
    mlMainnetPrivKeyIv,
    btcIv,
    mlTestnetPrivKeyTag,
    mlMainnetPrivKeyTag,
    btcTag,
  } = await getEnvelopeEncryptedPrivateKeys(password, undefined, mnemonic)

  const account = {
    name,
    salt,
    encryptionVersion,
    wrappedDek,
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
  const accountJson = await IndexedDB.getAccountJSON(account.id)
  const blob = new Blob([accountJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mojito_${account.name}.json`
  a.click()
}

const restoreAccountFromJSON = async (json) => {
  await IndexedDB.restoreAccountFromJSON(json)
}

const checkPasswordValidity = async (id, password) => {
  const { decryptSeed } = await loadAccountSubRoutines()
  try {
    const account = await getAccount(id)
    if (!account?.salt || !account?.seed?.btcEncryptedSeed) return false

    const key = await getContentKey(account, password)

    const decrypted = await decryptSeed({
      data: account.seed.btcEncryptedSeed,
      iv: account.iv.btcIv,
      tag: account.tag.btcTag,
      key,
      aad: aadFor(account, contentAad('btcEncryptedSeed')),
    })

    if (!decrypted) return false
    return true
  } catch {
    return false
  }
}

const unlockHtlsSecret = async ({ accountId, password, hash }) => {
  const { decryptSeed } = await loadAccountSubRoutines()
  const account = await getAccount(accountId)
  if (!account) return Promise.reject('Account not found')
  if (!account.htlsSecrets || !account.htlsSecrets[hash])
    return Promise.reject('No secret found for the provided hash')

  let key

  try {
    key = await getContentKey(account, password)
  } catch {
    return Promise.reject('Invalid password')
  }

  const data = account.htlsSecrets[hash]

  try {
    const decrypted = await decryptSeed({
      data: data.encryptedHtlsSecret,
      iv: data.htlsIv,
      tag: data.htlsTag,
      key,
      aad: aadFor(account, htlsAad(hash)),
    })

    if (!decrypted) throw new Error('Empty secret')

    return new TextDecoder().decode(decrypted)
  } catch {
    return Promise.reject(
      'Failed to decrypt the secret. Possibly wrong password.',
    )
  }
}

const saveProvidedHtlsSecret = async ({ accountId, password, data }) =>
  withAccountLock(accountId, async () => {
    const account = await getAccount(accountId)
    if (!account) return Promise.reject('Account not found')

    let key

    try {
      key = await getContentKey(account, password)
    } catch {
      return Promise.reject('Invalid password')
    }

    const { encryptedHtlsSecret, htlsIv, htlsTag } =
      await getEncryptedHtlsSecret(
        key,
        data.secret,
        aadFor(account, htlsAad(data.hash)),
      )

    const current = await getAccount(accountId)

    await updateAccount(accountId, {
      htlsSecrets: {
        ...current.htlsSecrets,
        [data.hash]: {
          encryptedHtlsSecret,
          htlsIv,
          htlsTag,
          txHash: data.txHash,
        },
      },
    })
  })

const getPasskeys = async (accountId) => {
  const account = await getAccount(accountId)

  return (account?.wrappedDek?.passkeys ?? []).map(
    ({ credentialId, label, createdAt }) => ({
      credentialId,
      label,
      createdAt,
    }),
  )
}

const enrollPasskey = async ({ accountId, password, label }) => {
  if (!Passkey.isSupported())
    return Promise.reject('Passkeys are not available in this browser')

  const account = await getAccount(accountId)
  if (!account) return Promise.reject('Account not found')
  if (!isEnvelope(getAccountVersion(account)))
    return Promise.reject('Unlock this account with your password first')

  const dek = await getContentKey(account, password)
  const { credentialId, prfSalt, prfOutput } = await Passkey.enroll(
    account.name,
  )

  return withAccountLock(accountId, async () => {
    const current = await getAccount(accountId)

    if (
      (current.wrappedDek?.passkeys ?? []).some(
        (entry) => entry.credentialId === credentialId,
      )
    )
      return Promise.reject('This passkey is already enrolled')

    const wrapper = await buildPasskeyWrapper({
      dek,
      credentialId,
      prfSalt,
      prfOutput,
      label,
    })

    const stored = await getAccount(accountId)

    await updateAccount(accountId, {
      wrappedDek: {
        ...stored.wrappedDek,
        passkeys: [...(stored.wrappedDek?.passkeys ?? []), wrapper],
      },
    })

    return { credentialId, label }
  })
}

const removePasskey = async ({ accountId, credentialId }) =>
  withAccountLock(accountId, async () => {
    const account = await getAccount(accountId)
    if (!account) return Promise.reject('Account not found')

    const passkeys = account.wrappedDek?.passkeys ?? []

    if (!passkeys.some((entry) => entry.credentialId === credentialId))
      return Promise.reject('Passkey not found')

    await updateAccount(accountId, {
      wrappedDek: {
        ...account.wrappedDek,
        passkeys: passkeys.filter(
          (entry) => entry.credentialId !== credentialId,
        ),
      },
    })
  })

const unlockAccountWithPasskey = async (id, options) => {
  const account = await getAccount(id)
  const passkeys = account?.wrappedDek?.passkeys ?? []

  if (!passkeys.length)
    return Promise.reject('No passkey is enrolled for this account')

  const { credentialId, prfOutput } = await Passkey.getPrfOutput(passkeys)

  return unlockAccount(
    id,
    { kind: PASSKEY_CREDENTIAL, credentialId, prfOutput },
    options,
  )
}

const reEncryptAccount = async ({
  id,
  password,
  account,
  decryptedSeeds,
  contentKey,
}) => {
  // A credential descriptor would be stringified into the KDF, and enrolled
  // passkeys cannot be re-wrapped without their PRF outputs. Both must fail loudly
  // rather than silently re-key the wallet to something nobody can reproduce.
  if (typeof password !== 'string')
    throw new Error('Re-encryption needs the account password')

  if (account.wrappedDek?.passkeys?.length)
    throw new Error(
      'Remove the enrolled passkeys before migrating this account',
    )

  const { generateEncryptionKey, encryptSeed, decryptSeed } =
    await loadAccountSubRoutines()

  const { key: wrappingKey, salt: newSalt } = await generateEncryptionKey({
    password,
    version: CURRENT_ENCRYPTION_VERSION,
  })

  const newKey = await generateDek()

  const reEncrypt = async (data, aad) => {
    if (!data) return {}

    const { encryptedData, iv, tag } = await encryptSeed({
      data,
      key: newKey,
      aad,
    })
    return { encryptedData, iv, tag }
  }

  const {
    encryptedData: btcEncryptedSeed,
    iv: btcIv,
    tag: btcTag,
  } = await reEncrypt(decryptedSeeds.seed, contentAad('btcEncryptedSeed'))

  const {
    encryptedData: encryptedMlTestnetPrivateKey,
    iv: mlTestnetPrivKeyIv,
    tag: mlTestnetPrivKeyTag,
  } = await reEncrypt(
    decryptedSeeds.mlTestnetPrivateKey,
    contentAad('encryptedMlTestnetPrivateKey'),
  )

  const {
    encryptedData: encryptedMlMainnetPrivateKey,
    iv: mlMainnetPrivKeyIv,
    tag: mlMainnetPrivKeyTag,
  } = await reEncrypt(
    decryptedSeeds.mlMainnetPrivateKey,
    contentAad('encryptedMlMainnetPrivateKey'),
  )

  const updatedHtlsSecrets = {}

  for (const [hash, data] of Object.entries(account.htlsSecrets ?? {})) {
    // A secret that cannot be read is carried over untouched: it was already
    // unreadable, and it must never cost the user access to the seed.
    try {
      const decryptedSecret = await decryptSeed({
        data: data.encryptedHtlsSecret,
        iv: data.htlsIv,
        tag: data.htlsTag,
        key: contentKey,
        aad: aadFor(account, htlsAad(hash)),
      })
      const {
        encryptedData: encryptedHtlsSecret,
        iv: htlsIv,
        tag: htlsTag,
      } = await reEncrypt(decryptedSecret, htlsAad(hash))
      updatedHtlsSecrets[hash] = {
        encryptedHtlsSecret,
        htlsIv,
        htlsTag,
        txHash: data.txHash,
      }
    } catch (e) {
      console.error(`Could not re-encrypt the HTLS secret ${hash}:`, e)
      updatedHtlsSecrets[hash] = data
    }
  }

  const passwordWrapper = await wrapDek({
    dek: newKey,
    wrappingKey,
    aad: wrapperAad(PASSWORD_CREDENTIAL),
  })

  await updateAccount(id, {
    salt: newSalt,
    encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    wrappedDek: { password: passwordWrapper, passkeys: [] },
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
  const storedNetworkType = LocalStorageService.getItem('networkType')

  const { decryptSeed } = await loadAccountSubRoutines()
  const addresses = {}

  try {
    const account = await getAccount(id)
    const walletsToCreate = AppInfo.DEFAULT_WALLETS_TO_CREATE

    if (!account.walletsToCreate)
      await updateAccount(id, {
        walletsToCreate: AppInfo.DEFAULT_WALLETS_TO_CREATE,
      })

    const accountVersion = getAccountVersion(account)

    const key = await getContentKey(account, password)

    const seed = await decryptSeed({
      data: account.seed.btcEncryptedSeed,
      iv: account.iv.btcIv,
      tag: account.tag.btcTag,
      key,
      aad: aadFor(account, contentAad('btcEncryptedSeed')),
    })

    const mlTestnetPrivateKey = account.seed.encryptedMlTestnetPrivateKey
      ? await decryptSeed({
          data: account.seed.encryptedMlTestnetPrivateKey,
          iv: account.iv.mlTestnetPrivKeyIv,
          tag: account.tag.mlTestnetPrivKeyTag,
          key,
          aad: aadFor(account, contentAad('encryptedMlTestnetPrivateKey')),
        })
      : undefined

    const mlMainnetPrivateKey = account.seed.encryptedMlMainnetPrivateKey
      ? await decryptSeed({
          data: account.seed.encryptedMlMainnetPrivateKey,
          iv: account.iv.mlMainnetPrivKeyIv,
          tag: account.tag.mlMainnetPrivKeyTag,
          key,
          aad: aadFor(account, contentAad('encryptedMlMainnetPrivateKey')),
        })
      : undefined
    const btcAddressType =
      account.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

    const walletsToUnlock = wallets || walletsToCreate

    let btcHDWallet = null
    let btcAddressData = null
    if (walletsToUnlock.includes('btc')) {
      btcHDWallet = BTC.getHDWalletFromSeed(Buffer.from(seed))
      btcAddressData = await BTC_ADDRESS_TYPE_MAP[
        account.walletType
      ].getAddresses(
        btcHDWallet,
        BtcHelpers.getNetwork(),
        AppInfo.BTC_DEFAULT_ADDRESSES_BATCH,
        btcAddressType,
      )
      const btcAddresses = BtcHelpers.getBtcAddresses(btcAddressData)
      addresses.btcAddresses = btcAddresses
    }

    if (walletsToUnlock.includes('ml')) {
      if (storedNetworkType === 'testnet') {
        const mlTestnetWalletAddresses = await ML.getWalletAddresses(
          mlTestnetPrivateKey,
          AppInfo.NETWORK_TYPES.TESTNET,
          AppInfo.DEFAULT_ML_WALLET_OFFSET,
        )
        addresses.mlAddresses = mlTestnetWalletAddresses
      }

      if (storedNetworkType === 'mainnet') {
        const mlMainnetWalletAddresses = await ML.getWalletAddresses(
          mlMainnetPrivateKey,
          AppInfo.NETWORK_TYPES.MAINNET,
          AppInfo.DEFAULT_ML_WALLET_OFFSET,
        )
        addresses.mlAddresses = mlMainnetWalletAddresses
      }
    }

    // Migrating is opportunistic: a failure must leave the account on its old
    // version rather than deny access to a wallet that just decrypted fine.
    if (accountVersion !== CURRENT_ENCRYPTION_VERSION) {
      try {
        await withAccountLock(id, async () => {
          const current = await getAccount(id)

          if (getAccountVersion(current) === CURRENT_ENCRYPTION_VERSION) return

          await reEncryptAccount({
            id,
            password,
            account: current,
            contentKey: key,
            decryptedSeeds: {
              seed,
              mlTestnetPrivateKey,
              mlMainnetPrivateKey,
            },
          })
        })
      } catch (e) {
        console.error('Encryption migration failed:', e)
      }
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
    })
  }
}

export {
  saveAccount,
  unlockAccount,
  unlockAccountWithPasskey,
  getPasskeys,
  enrollPasskey,
  removePasskey,
  updateAccount,
  getAccount,
  deleteAccount,
  backupAccountToJSON,
  restoreAccountFromJSON,
  unlockHtlsSecret,
  saveProvidedHtlsSecret,
  checkPasswordValidity,
}
