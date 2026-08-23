import {
  DATABASENAME,
  ACCOUNTSSTORENAME,
  SCHEMAVERSION,
  loadAccounts,
  getAll,
  save,
} from 'src/services/Database/IndexedDB/IndexedDB'
import { ACCOUNT_MIGRATIONS, migrateAccount } from './migrations'

const deleteDatabase = () =>
  new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(DATABASENAME)
    request.onsuccess = resolve
    request.onerror = resolve
    request.onblocked = resolve
  })

const seedDatabaseAtVersion = (version, accounts) =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASENAME, version)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(ACCOUNTSSTORENAME)) {
        const objectStore = db.createObjectStore(ACCOUNTSSTORENAME, {
          keyPath: 'id',
          autoIncrement: true,
        })
        objectStore.createIndex('name', 'name', { unique: false })
      }

      const store = event.target.transaction.objectStore(ACCOUNTSSTORENAME)
      accounts.forEach((account) => store.put(account))
    }

    request.onsuccess = (event) => {
      event.target.result.close()
      resolve()
    }
    request.onerror = reject
  })

const readAccounts = async () => getAll(await loadAccounts())

beforeEach(deleteDatabase)
afterAll(deleteDatabase)

test('migrations - a v1 account is reshaped and gains htlsSecrets', async () => {
  await seedDatabaseAtVersion(1, [
    {
      id: 1,
      name: 'Legacy',
      salt: 'aabb',
      iv: 'flat-iv',
      tag: 'flat-tag',
      seed: 'flat-seed',
    },
  ])

  const [account] = await readAccounts()

  expect(account.iv).toStrictEqual({ btcIv: 'flat-iv' })
  expect(account.tag).toStrictEqual({ btcTag: 'flat-tag' })
  expect(account.seed).toStrictEqual({ btcEncryptedSeed: 'flat-seed' })
  expect(account.htlsSecrets).toStrictEqual({})
  expect(account.name).toBe('Legacy')
})

test('migrations - a v2 account only gains htlsSecrets and is not reshaped again', async () => {
  const nested = {
    id: 1,
    name: 'Nested',
    iv: { btcIv: 'iv', mlTestnetPrivKeyIv: 'iv2', mlMainnetPrivKeyIv: 'iv3' },
    tag: {
      btcTag: 'tag',
      mlTestnetPrivKeyTag: 'tag2',
      mlMainnetPrivKeyTag: 'tag3',
    },
    seed: {
      btcEncryptedSeed: 'seed',
      encryptedMlTestnetPrivateKey: 'ml-test',
      encryptedMlMainnetPrivateKey: 'ml-main',
    },
  }

  await seedDatabaseAtVersion(2, [nested])

  const [account] = await readAccounts()

  expect(account.iv).toStrictEqual(nested.iv)
  expect(account.tag).toStrictEqual(nested.tag)
  expect(account.seed).toStrictEqual(nested.seed)
  expect(account.htlsSecrets).toStrictEqual({})
})

test('migrations - existing htlsSecrets are preserved', async () => {
  const secrets = {
    abc: { encryptedHtlsSecret: 'x', htlsIv: 'y', htlsTag: 'z' },
  }

  await seedDatabaseAtVersion(2, [
    {
      id: 1,
      name: 'WithSecrets',
      iv: { btcIv: 'iv' },
      tag: { btcTag: 'tag' },
      seed: { btcEncryptedSeed: 'seed' },
      htlsSecrets: secrets,
    },
  ])

  const [account] = await readAccounts()

  expect(account.htlsSecrets).toStrictEqual(secrets)
})

test('migrations - do not touch an account saved into a freshly created database', async () => {
  const account = {
    name: 'Fresh',
    salt: 'aabb',
    encryptionVersion: 3,
    iv: { btcIv: 'iv', mlTestnetPrivKeyIv: 'iv2', mlMainnetPrivKeyIv: 'iv3' },
    tag: {
      btcTag: 'tag',
      mlTestnetPrivKeyTag: 'tag2',
      mlMainnetPrivKeyTag: 'tag3',
    },
    seed: {
      btcEncryptedSeed: 'seed',
      encryptedMlTestnetPrivateKey: 'ml-test',
      encryptedMlMainnetPrivateKey: 'ml-main',
    },
    htlsSecrets: {},
  }

  await save(await loadAccounts(), account)
  await new Promise((resolve) => setTimeout(resolve, 50))

  const [stored] = await readAccounts()

  expect(stored.seed).toStrictEqual(account.seed)
  expect(stored.iv).toStrictEqual(account.iv)
  expect(stored.tag).toStrictEqual(account.tag)
})

test('migrations - a v1 database with no accounts upgrades cleanly', async () => {
  await seedDatabaseAtVersion(1, [])

  await expect(readAccounts()).resolves.toStrictEqual([])
})

test('migrations - a record double-nested by the old migration is repaired', async () => {
  const inner = {
    btcIv: 'iv',
    mlTestnetPrivKeyIv: 'iv2',
    mlMainnetPrivKeyIv: 'iv3',
  }
  const innerTag = {
    btcTag: 'tag',
    mlTestnetPrivKeyTag: 'tag2',
    mlMainnetPrivKeyTag: 'tag3',
  }
  const innerSeed = {
    btcEncryptedSeed: 'seed',
    encryptedMlTestnetPrivateKey: 'ml-test',
    encryptedMlMainnetPrivateKey: 'ml-main',
  }

  await seedDatabaseAtVersion(3, [
    {
      id: 1,
      name: 'Corrupted',
      encryptionVersion: 3,
      iv: { btcIv: inner },
      tag: { btcTag: innerTag },
      seed: { btcEncryptedSeed: innerSeed },
      htlsSecrets: {},
    },
  ])

  const [account] = await readAccounts()

  expect(account.iv).toStrictEqual(inner)
  expect(account.tag).toStrictEqual(innerTag)
  expect(account.seed).toStrictEqual(innerSeed)
})

test('migrations - a healthy record is not changed by the repair', async () => {
  const healthy = {
    id: 1,
    name: 'Healthy',
    encryptionVersion: 3,
    iv: { btcIv: 'iv', mlTestnetPrivKeyIv: 'iv2', mlMainnetPrivKeyIv: 'iv3' },
    tag: {
      btcTag: 'tag',
      mlTestnetPrivKeyTag: 'tag2',
      mlMainnetPrivKeyTag: 'tag3',
    },
    seed: {
      btcEncryptedSeed: 'seed',
      encryptedMlTestnetPrivateKey: 'ml-test',
      encryptedMlMainnetPrivateKey: 'ml-main',
    },
    htlsSecrets: {},
  }

  await seedDatabaseAtVersion(3, [healthy])

  const [account] = await readAccounts()

  expect(account).toStrictEqual(healthy)
})

test('migrations - a v4 envelope record survives the schema upgrade untouched', async () => {
  const envelope = {
    id: 1,
    name: 'Envelope',
    salt: 'aabb',
    encryptionVersion: 4,
    wrappedDek: {
      password: { encryptedData: 'w', iv: 'wi', tag: 'wt' },
      passkeys: [],
    },
    iv: { btcIv: 'iv', mlTestnetPrivKeyIv: 'iv2', mlMainnetPrivKeyIv: 'iv3' },
    tag: {
      btcTag: 'tag',
      mlTestnetPrivKeyTag: 'tag2',
      mlMainnetPrivKeyTag: 'tag3',
    },
    seed: {
      btcEncryptedSeed: 'seed',
      encryptedMlTestnetPrivateKey: 'ml-test',
      encryptedMlMainnetPrivateKey: 'ml-main',
    },
    htlsSecrets: {},
  }

  await seedDatabaseAtVersion(3, [envelope])

  const [account] = await readAccounts()

  expect(account).toStrictEqual(envelope)
})

test('migrations - the schema version and the ladder cannot drift apart', () => {
  expect(SCHEMAVERSION).toBe(ACCOUNT_MIGRATIONS.length + 1)
})

test('migrations - an account only runs the migrations above its own version', () => {
  const v3Account = {
    seed: { btcEncryptedSeed: 'seed' },
    iv: { btcIv: 'iv' },
    tag: { btcTag: 'tag' },
    htlsSecrets: { abc: {} },
  }

  expect(migrateAccount(v3Account, 3)).toStrictEqual(v3Account)
  expect(migrateAccount(v3Account, 4)).toBe(v3Account)
})

test('migrations - a flat v1 account walks the whole ladder', () => {
  const migrated = migrateAccount({ seed: 'blob', iv: 'iv', tag: 'tag' }, 1)

  expect(migrated).toStrictEqual({
    seed: { btcEncryptedSeed: 'blob' },
    iv: { btcIv: 'iv' },
    tag: { btcTag: 'tag' },
    htlsSecrets: {},
  })
})
