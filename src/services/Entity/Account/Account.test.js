import { BTC, ML, Cipher, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { LocalStorageService } from '@Storage'
import { IndexedDB } from '@Databases'
import { AppInfo } from '@Constants'
import initWasm from 'src/tests/helpers/initWasm'
import loadAccountSubRoutines from './loadWorkers'
import {
  saveAccount,
  unlockAccount,
  updateAccount,
  getAccount,
  unlockHtlsSecret,
  saveProvidedHtlsSecret,
  checkPasswordValidity,
} from './Account'
import { buildPasskeyWrapper } from './AccountHelpers'

const accountName = 'Savings'
const password = 'pass'
const defaultWalletsToCreate = ['btc']

const btcOnly = { wallets: ['btc'] }

beforeAll(() => initWasm())

beforeEach(() => {
  LocalStorageService.setItem('networkType', 'testnet')
})

const newMnemonic = async () => {
  const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
  return generateNewAccountMnemonic()
}

const createAccount = async (overrides = {}) => {
  const mnemonic = overrides.mnemonic || (await newMnemonic())

  const id = await saveAccount({
    name: accountName,
    password,
    mnemonic,
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
    ...overrides,
  })

  return { id, mnemonic }
}

const saveLegacyAccount = async (version, mnemonic) => {
  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version })
  const encrypt = (data) => Cipher.encryptAES({ data, key })

  const seed = await BTC.getSeedFromMnemonic(mnemonic)
  const btc = await encrypt(seed)
  const mlTestnet = await encrypt(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.TESTNET),
  )
  const mlMainnet = await encrypt(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.MAINNET),
  )
  const secret = await encrypt('legacy-htls-secret')

  return IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: accountName,
    salt,
    encryptionVersion: version,
    iv: {
      btcIv: btc.iv,
      mlTestnetPrivKeyIv: mlTestnet.iv,
      mlMainnetPrivKeyIv: mlMainnet.iv,
    },
    tag: {
      btcTag: btc.tag,
      mlTestnetPrivKeyTag: mlTestnet.tag,
      mlMainnetPrivKeyTag: mlMainnet.tag,
    },
    seed: {
      btcEncryptedSeed: btc.encryptedData,
      encryptedMlTestnetPrivateKey: mlTestnet.encryptedData,
      encryptedMlMainnetPrivateKey: mlMainnet.encryptedData,
    },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
    htlsSecrets: {
      abc: {
        encryptedHtlsSecret: secret.encryptedData,
        htlsIv: secret.iv,
        htlsTag: secret.tag,
        txHash: 'tx',
      },
    },
  })
}

const receivingAddressesOf = (addresses) =>
  addresses.btcAddresses.btcReceivingAddresses.map(
    (entry) => Object.keys(entry)[0],
  )

test('Account - creation and unlocking returns the account name and addresses', async () => {
  const { id } = await createAccount()

  const { addresses, name } = await unlockAccount(id, password, btcOnly)

  expect(name).toBe(accountName)
  expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(0)
  expect(addresses.btcAddresses.btcChangeAddresses.length).toBeGreaterThan(0)
})

test('Account - unlocking with a wrong password is rejected', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { id } = await createAccount()

  await expect(unlockAccount(id, 'pasz', btcOnly)).rejects.toStrictEqual({
    addresses: {},
    btcPrivateKeys: { btcHDWallet: null, btcAddressData: null },
    name: '',
    mlPrivKeys: { mlMainnetPrivateKey: '', mlTestnetPrivateKey: '' },
  })

  console.error.mockRestore()
})

test('Account - a new account is stored as a v4 envelope', async () => {
  const { id } = await createAccount()
  const account = await getAccount(id)

  expect(account.encryptionVersion).toBe(4)
  expect(account.salt).toMatch(/^[0-9a-f]{32}$/)
  expect(account.seed.btcEncryptedSeed).toBeDefined()
  expect(account.seed.encryptedMlTestnetPrivateKey).toBeDefined()
  expect(account.seed.encryptedMlMainnetPrivateKey).toBeDefined()

  expect(account.wrappedDek.passkeys).toStrictEqual([])
  expect(Object.keys(account.wrappedDek.password)).toStrictEqual([
    'encryptedData',
    'iv',
    'tag',
  ])
})

test('Account - an account saved without walletsToCreate still unlocks', async () => {
  const { id } = await createAccount({ walletsToCreate: undefined })
  const account = await getAccount(id)

  expect(account.walletsToCreate).toBeUndefined()

  const { addresses } = await unlockAccount(id, password, btcOnly)

  expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(0)
})

test('Account - walletsToCreate is kept when provided', async () => {
  const { id } = await createAccount({ walletsToCreate: ['btc', 'ml'] })
  const account = await getAccount(id)

  expect(account.walletsToCreate).toStrictEqual(['btc', 'ml'])
})

test('Account - unlocking derives a batch of BTC addresses', async () => {
  const { id } = await createAccount()

  const { addresses, btcPrivateKeys } = await unlockAccount(
    id,
    password,
    btcOnly,
  )

  const receiving = receivingAddressesOf(addresses)

  expect(receiving.length).toBeGreaterThan(1)
  expect(new Set(receiving).size).toBe(receiving.length)
  expect(btcPrivateKeys.btcHDWallet).not.toBeNull()
  expect(btcPrivateKeys.btcAddressData).not.toBeNull()
})

test('Account - the same mnemonic always unlocks to the same addresses', async () => {
  const mnemonic = await newMnemonic()
  const { id: firstId } = await createAccount({ mnemonic })
  const { id: secondId } = await createAccount({ mnemonic, name: 'Second' })

  const first = await unlockAccount(firstId, password, btcOnly)
  const second = await unlockAccount(secondId, password, btcOnly)

  expect(receivingAddressesOf(first.addresses)).toStrictEqual(
    receivingAddressesOf(second.addresses),
  )
})

test('Account - two accounts from the same mnemonic use different salts', async () => {
  const mnemonic = await newMnemonic()
  const { id: firstId } = await createAccount({ mnemonic })
  const { id: secondId } = await createAccount({ mnemonic, name: 'Second' })

  const first = await getAccount(firstId)
  const second = await getAccount(secondId)

  expect(first.salt).not.toBe(second.salt)
  expect(first.seed.btcEncryptedSeed).not.toBe(second.seed.btcEncryptedSeed)
})

test('Account - different mnemonics unlock to different addresses', async () => {
  const { id: firstId } = await createAccount()
  const { id: secondId } = await createAccount({ name: 'Second' })

  const first = await unlockAccount(firstId, password, btcOnly)
  const second = await unlockAccount(secondId, password, btcOnly)

  expect(receivingAddressesOf(first.addresses)).not.toStrictEqual(
    receivingAddressesOf(second.addresses),
  )
})

test.each([1, 2, 3])(
  'Account - a v%i account migrates to the envelope on unlock',
  async (version) => {
    const mnemonic = await newMnemonic()
    const id = await saveLegacyAccount(version, mnemonic)

    const before = await getAccount(id)
    expect(before.encryptionVersion).toBe(version)
    expect(before.wrappedDek).toBeUndefined()

    const { addresses } = await unlockAccount(id, password, btcOnly)
    expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(
      0,
    )

    const after = await getAccount(id)
    expect(after.encryptionVersion).toBe(4)
    expect(after.wrappedDek.passkeys).toStrictEqual([])
    expect(after.salt).not.toBe(before.salt)
    expect(after.seed.btcEncryptedSeed).not.toBe(before.seed.btcEncryptedSeed)
  },
)

test('Account - a migrated account still unlocks to the same addresses', async () => {
  const mnemonic = await newMnemonic()
  const legacyId = await saveLegacyAccount(3, mnemonic)
  const { id: envelopeId } = await createAccount({ mnemonic })

  const migrated = await unlockAccount(legacyId, password, btcOnly)
  const fresh = await unlockAccount(envelopeId, password, btcOnly)

  expect(receivingAddressesOf(migrated.addresses)).toStrictEqual(
    receivingAddressesOf(fresh.addresses),
  )

  const again = await unlockAccount(legacyId, password, btcOnly)
  expect(receivingAddressesOf(again.addresses)).toStrictEqual(
    receivingAddressesOf(migrated.addresses),
  )
})

test('Account - HTLS secrets survive the migration', async () => {
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  await unlockAccount(id, password, btcOnly)

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'abc' }),
  ).resolves.toBe('legacy-htls-secret')
})

test('Account - an HTLS secret can be stored and read back on an envelope account', async () => {
  const { id } = await createAccount()

  await saveProvidedHtlsSecret({
    accountId: id,
    password,
    data: { hash: 'def', secret: 'fresh-secret', txHash: 'tx' },
  })

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'def' }),
  ).resolves.toBe('fresh-secret')
})

test('Account - a wrong password cannot read an HTLS secret', async () => {
  const { id } = await createAccount()

  await saveProvidedHtlsSecret({
    accountId: id,
    password,
    data: { hash: 'def', secret: 'fresh-secret', txHash: 'tx' },
  })

  await expect(
    unlockHtlsSecret({ accountId: id, password: 'pasz', hash: 'def' }),
  ).rejects.toBe('Invalid password')
})

test('Account - an account whose ML blobs cannot be decrypted is left untouched', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const mnemonic = await newMnemonic()
  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version: 3 })
  const otherKey = await Cipher.generateDek()

  const seed = await BTC.getSeedFromMnemonic(mnemonic)
  const btc = await Cipher.encryptAES({ data: seed, key })
  const mlTestnet = await Cipher.encryptAES({
    data: 'ml-testnet',
    key: otherKey,
  })
  const mlMainnet = await Cipher.encryptAES({
    data: 'ml-mainnet',
    key: otherKey,
  })

  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: accountName,
    salt,
    encryptionVersion: 3,
    iv: {
      btcIv: btc.iv,
      mlTestnetPrivKeyIv: mlTestnet.iv,
      mlMainnetPrivKeyIv: mlMainnet.iv,
    },
    tag: {
      btcTag: btc.tag,
      mlTestnetPrivKeyTag: mlTestnet.tag,
      mlMainnetPrivKeyTag: mlMainnet.tag,
    },
    seed: {
      btcEncryptedSeed: btc.encryptedData,
      encryptedMlTestnetPrivateKey: mlTestnet.encryptedData,
      encryptedMlMainnetPrivateKey: mlMainnet.encryptedData,
    },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
    htlsSecrets: {},
  })

  const before = await getAccount(id)

  await expect(unlockAccount(id, password, btcOnly)).rejects.toBeDefined()

  const after = await getAccount(id)

  expect(after.encryptionVersion).toBe(3)
  expect(after.salt).toBe(before.salt)
  expect(after.seed).toStrictEqual(before.seed)
  expect(after.wrappedDek).toBeUndefined()

  console.error.mockRestore()
})

const CREDENTIAL_ID = 'Y3JlZC1pZC0x'

const enrollPasskey = async (id, prfOutput) => {
  const account = await getAccount(id)

  const { key: wrappingKey } = await Cipher.generatePBKDF2Key({
    password,
    salt: account.salt,
    version: account.encryptionVersion,
  })
  const dek = await Cipher.unwrapDek({
    data: account.wrappedDek.password.encryptedData,
    iv: account.wrappedDek.password.iv,
    tag: account.wrappedDek.password.tag,
    wrappingKey,
    aad: Cipher.wrapperAad('password'),
  })

  const wrapper = await buildPasskeyWrapper({
    dek,
    credentialId: CREDENTIAL_ID,
    prfSalt: 'c2FsdA',
    prfOutput,
    label: 'Touch ID',
  })

  await updateAccount(id, {
    wrappedDek: { ...account.wrappedDek, passkeys: [wrapper] },
  })

  return wrapper
}

const passkeyCredential = (prfOutput, credentialId = CREDENTIAL_ID) => ({
  kind: 'passkey',
  credentialId,
  prfOutput,
})

test('Account - the same account unlocks with both a password and a passkey', async () => {
  const { id } = await createAccount()
  const prfOutput = await Cipher.generateDek()

  await enrollPasskey(id, prfOutput)

  const byPassword = await unlockAccount(id, password, btcOnly)
  const byPasskey = await unlockAccount(
    id,
    passkeyCredential(prfOutput),
    btcOnly,
  )

  expect(receivingAddressesOf(byPasskey.addresses)).toStrictEqual(
    receivingAddressesOf(byPassword.addresses),
  )
})

test('Account - enrolling a passkey does not re-encrypt the seed', async () => {
  const { id } = await createAccount()
  const before = await getAccount(id)

  await enrollPasskey(id, await Cipher.generateDek())

  const after = await getAccount(id)

  expect(after.seed).toStrictEqual(before.seed)
  expect(after.iv).toStrictEqual(before.iv)
  expect(after.tag).toStrictEqual(before.tag)
  expect(after.wrappedDek.password).toStrictEqual(before.wrappedDek.password)
})

test('Account - a passkey wrapper records the fields the enrolment UI needs', async () => {
  const { id } = await createAccount()

  const wrapper = await enrollPasskey(id, await Cipher.generateDek())

  expect(wrapper.credentialId).toBe(CREDENTIAL_ID)
  expect(wrapper.prfSalt).toBe('c2FsdA')
  expect(wrapper.kdf).toBe(Cipher.PASSKEY_KDF)
  expect(wrapper.label).toBe('Touch ID')
  expect(typeof wrapper.createdAt).toBe('number')
})

test('Account - a wrong PRF output cannot unlock', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { id } = await createAccount()

  await enrollPasskey(id, await Cipher.generateDek())

  await expect(
    unlockAccount(id, passkeyCredential(await Cipher.generateDek()), btcOnly),
  ).rejects.toBeDefined()

  console.error.mockRestore()
})

test('Account - an unknown credential id cannot unlock', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const { id } = await createAccount()
  const prfOutput = await Cipher.generateDek()

  await enrollPasskey(id, prfOutput)

  await expect(
    unlockAccount(id, passkeyCredential(prfOutput, 'b3RoZXI'), btcOnly),
  ).rejects.toBeDefined()

  console.error.mockRestore()
})

test('Account - a passkey cannot unlock a legacy account', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  await expect(
    unlockAccount(id, passkeyCredential(await Cipher.generateDek()), btcOnly),
  ).rejects.toBeDefined()

  const after = await getAccount(id)
  expect(after.encryptionVersion).toBe(3)

  console.error.mockRestore()
})

test('Account - checkPasswordValidity still works on an account with a passkey', async () => {
  const { id } = await createAccount()

  await enrollPasskey(id, await Cipher.generateDek())

  await expect(checkPasswordValidity(id, password)).resolves.toBe(true)
  await expect(checkPasswordValidity(id, 'pasz')).resolves.toBe(false)
})

const countDeriveBits = async (task) => {
  const original = crypto.subtle.deriveBits.bind(crypto.subtle)
  const spy = jest.fn(original)
  crypto.subtle.deriveBits = spy

  try {
    await task()
  } finally {
    crypto.subtle.deriveBits = original
  }

  return spy.mock.calls.length
}

test('Account - migrating an account derives the password key twice, not three times', async () => {
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  const migrating = await countDeriveBits(() =>
    unlockAccount(id, password, btcOnly),
  )
  const steadyState = await countDeriveBits(() =>
    unlockAccount(id, password, btcOnly),
  )

  expect(migrating).toBe(2)
  expect(steadyState).toBe(1)
})

test('Account - concurrent unlocks migrate the account exactly once', async () => {
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  const results = await Promise.all([
    unlockAccount(id, password, btcOnly),
    unlockAccount(id, password, btcOnly),
    unlockAccount(id, password, btcOnly),
  ])

  const account = await getAccount(id)

  expect(account.encryptionVersion).toBe(4)
  expect(account.wrappedDek.passkeys).toStrictEqual([])

  results.forEach((result) =>
    expect(receivingAddressesOf(result.addresses)).toStrictEqual(
      receivingAddressesOf(results[0].addresses),
    ),
  )

  await expect(unlockAccount(id, password, btcOnly)).resolves.toBeDefined()
})

test('Account - a secret saved while a migration runs is not lost', async () => {
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  await Promise.all([
    unlockAccount(id, password, btcOnly),
    saveProvidedHtlsSecret({
      accountId: id,
      password,
      data: { hash: 'concurrent', secret: 'concurrent-secret', txHash: 'tx' },
    }),
  ])

  const account = await getAccount(id)
  expect(account.encryptionVersion).toBe(4)

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'concurrent' }),
  ).resolves.toBe('concurrent-secret')

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'abc' }),
  ).resolves.toBe('legacy-htls-secret')
})

test('Account - a genuine v1 record (no mintlayer keys) unlocks and migrates', async () => {
  const mnemonic = await newMnemonic()
  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version: 1 })
  const seed = await BTC.getSeedFromMnemonic(mnemonic)
  const btc = await Cipher.encryptAES({ data: seed, key })

  const id = await IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: accountName,
    salt,
    encryptionVersion: 1,
    iv: { btcIv: btc.iv },
    tag: { btcTag: btc.tag },
    seed: { btcEncryptedSeed: btc.encryptedData },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: ['btc'],
    htlsSecrets: {},
  })

  const { addresses } = await unlockAccount(id, password, btcOnly)

  expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(0)

  const after = await getAccount(id)

  expect(after.encryptionVersion).toBe(4)
  expect(after.seed.encryptedMlTestnetPrivateKey).toBeUndefined()
  expect(after.seed.encryptedMlMainnetPrivateKey).toBeUndefined()
  expect(after.wrappedDek.passkeys).toStrictEqual([])

  await expect(unlockAccount(id, password, btcOnly)).resolves.toBeDefined()
})

test('Account - swapping two content blobs under the same DEK is rejected', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const { id } = await createAccount()
  const account = await getAccount(id)

  await updateAccount(id, {
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

  await expect(unlockAccount(id, password, btcOnly)).rejects.toBeDefined()

  console.error.mockRestore()
})

test('Account - an HTLS secret is bound to its own hash', async () => {
  const { id } = await createAccount()

  await saveProvidedHtlsSecret({
    accountId: id,
    password,
    data: { hash: 'first', secret: 'first-secret', txHash: 'tx' },
  })

  const account = await getAccount(id)

  await updateAccount(id, {
    htlsSecrets: {
      ...account.htlsSecrets,
      second: account.htlsSecrets.first,
    },
  })

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'first' }),
  ).resolves.toBe('first-secret')

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'second' }),
  ).rejects.toBe('Failed to decrypt the secret. Possibly wrong password.')
})

const saveLegacyAccountWithSecrets = async (mnemonic, secrets) => {
  const { key, salt } = await Cipher.generatePBKDF2Key({ password, version: 3 })
  const encrypt = (data, withKey = key) =>
    Cipher.encryptAES({ data, key: withKey })

  const seed = await BTC.getSeedFromMnemonic(mnemonic)
  const btc = await encrypt(seed)
  const mlTestnet = await encrypt(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.TESTNET),
  )
  const mlMainnet = await encrypt(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.MAINNET),
  )

  const htlsSecrets = {}
  for (const [hash, { value, readable }] of Object.entries(secrets)) {
    const blob = await encrypt(
      value,
      readable ? key : await Cipher.generateDek(),
    )
    htlsSecrets[hash] = {
      encryptedHtlsSecret: blob.encryptedData,
      htlsIv: blob.iv,
      htlsTag: blob.tag,
      txHash: 'tx',
    }
  }

  return IndexedDB.save(await IndexedDB.loadAccounts(), {
    name: accountName,
    salt,
    encryptionVersion: 3,
    iv: {
      btcIv: btc.iv,
      mlTestnetPrivKeyIv: mlTestnet.iv,
      mlMainnetPrivKeyIv: mlMainnet.iv,
    },
    tag: {
      btcTag: btc.tag,
      mlTestnetPrivKeyTag: mlTestnet.tag,
      mlMainnetPrivKeyTag: mlMainnet.tag,
    },
    seed: {
      btcEncryptedSeed: btc.encryptedData,
      encryptedMlTestnetPrivateKey: mlTestnet.encryptedData,
      encryptedMlMainnetPrivateKey: mlMainnet.encryptedData,
    },
    walletType: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    walletsToCreate: defaultWalletsToCreate,
    htlsSecrets,
  })
}

test('Account - one unreadable HTLS secret does not block the wallet', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccountWithSecrets(mnemonic, {
    good: { value: 'good-secret', readable: true },
    broken: { value: 'lost-secret', readable: false },
  })

  const { addresses } = await unlockAccount(id, password, btcOnly)
  expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(0)

  const migrated = await getAccount(id)
  expect(migrated.encryptionVersion).toBe(4)

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'good' }),
  ).resolves.toBe('good-secret')

  await expect(
    unlockHtlsSecret({ accountId: id, password, hash: 'broken' }),
  ).rejects.toBeDefined()

  console.error.mockRestore()
})

test('Account - a failing migration still lets the wallet open', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})

  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  const generateDek = jest
    .spyOn(Cipher, 'generateDek')
    .mockRejectedValueOnce(new Error('no entropy'))

  const { addresses } = await unlockAccount(id, password, btcOnly)
  expect(addresses.btcAddresses.btcReceivingAddresses.length).toBeGreaterThan(0)

  const account = await getAccount(id)
  expect(account.encryptionVersion).toBe(3)

  generateDek.mockRestore()

  await expect(unlockAccount(id, password, btcOnly)).resolves.toBeDefined()
  await expect(getAccount(id)).resolves.toMatchObject({ encryptionVersion: 4 })

  console.error.mockRestore()
})

test('Account - both ml private keys decrypt to the keys the mnemonic derives', async () => {
  const { id, mnemonic } = await createAccount({
    walletsToCreate: ['btc', 'ml'],
  })

  const { mlPrivKeys } = await unlockAccount(id, password, btcOnly)

  expect(mlPrivKeys.mlTestnetPrivateKey).toStrictEqual(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.TESTNET),
  )
  expect(mlPrivKeys.mlMainnetPrivateKey).toStrictEqual(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.MAINNET),
  )
  expect(mlPrivKeys.mlTestnetPrivateKey).not.toStrictEqual(
    mlPrivKeys.mlMainnetPrivateKey,
  )
})

test('Account - a migrated legacy account still yields the right ml keys', async () => {
  const mnemonic = await newMnemonic()
  const id = await saveLegacyAccount(3, mnemonic)

  await unlockAccount(id, password, btcOnly)

  expect((await getAccount(id)).encryptionVersion).toBe(4)

  const { mlPrivKeys } = await unlockAccount(id, password, btcOnly)

  expect(mlPrivKeys.mlTestnetPrivateKey).toStrictEqual(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.TESTNET),
  )
  expect(mlPrivKeys.mlMainnetPrivateKey).toStrictEqual(
    ML.getPrivateKeyFromMnemonic(mnemonic, AppInfo.NETWORK_TYPES.MAINNET),
  )
})
