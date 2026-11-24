import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import {
  DATABASENAME,
  ACCOUNTSSTORENAME,
  SCHEMAVERSION,
  createOrUpdateDatabase,
  createTransaction,
  deleteAccount,
  loadAccounts,
  openDatabase,
  restoreAccountFromJSON,
  save,
  get,
  getAll,
} from './IndexedDB'

global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
const deleteDatabase = () => indexedDB.deleteDatabase(DATABASENAME)

test('IndexedDB basic functions - loadAccounts', async () => {
  const accountsStore = await loadAccounts()

  expect(accountsStore._name).toBe('accounts')
  expect(accountsStore.indexNames[0]).toBe('name')
  expect(accountsStore.keyPath).toBe('id')

  deleteDatabase()
})

test('IndexedDB basic functions - loadAccounts error', async () => {
  const onError = (event) => expect(event).toBeInstanceOf(Error)
  await loadAccounts(onError, null)
})

test('IndexedDB basic functions - deleteAccount rethrows on failure', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const onError = jest.fn()
    // a null DB makes openDatabase reject — the same failure source the
    // loadAccounts error test uses
    await expect(
      deleteAccount('account-id', onError, null),
    ).rejects.toBeInstanceOf(Error)
    expect(onError).toHaveBeenCalledTimes(1)
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB basic functions - deleteAccount rethrows write failures as Errors', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    // the store WRITE fails (e.g. quota): the request helper must reject
    // with the underlying Error, not the raw IDB event, so the rethrown
    // value carries .message for callers
    const writeError = new Error('quota exceeded')
    const failingStore = {
      delete: () => ({
        set onsuccess(_) {},
        set onerror(handler) {
          queueMicrotask(() => handler({ target: { error: writeError } }))
        },
      }),
    }
    const fakeDb = {
      transaction: () => ({ objectStore: () => failingStore }),
      close: () => {},
    }
    const fakeFactory = {
      open: () => {
        const request = {}
        queueMicrotask(() => request.onsuccess({ target: { result: fakeDb } }))
        return request
      },
    }

    const onError = jest.fn()
    await expect(
      deleteAccount('account-id', onError, fakeFactory),
    ).rejects.toBe(writeError)
    expect(onError).toHaveBeenCalledWith(writeError)
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB basic functions - createOrUpdateDatabase', async () => {
  const createIndex = jest.fn((name, keyPath, options) => {
    expect(name).toBeDefined()
    expect(keyPath).toBeDefined()
    expect(Object.keys(options).length).toBeGreaterThan(0)
  })

  const createObjectStore = jest.fn((storeName, options) => {
    expect(storeName).toBeDefined()
    expect(Object.keys(options)).toContain('keyPath')

    return { createIndex }
  })

  const event = {
    oldVersion: 0,
    target: {
      result: {
        createObjectStore,
        objectStoreNames: {
          contains: jest.fn().mockReturnValue(false),
        },
      },
    },
  }

  createOrUpdateDatabase(event)

  expect(createObjectStore).toHaveBeenCalled()
  expect(createIndex).toHaveBeenCalled()
})

test('IndexedDB basic functions - createOrUpdateDatabase skips migrations on a new database', () => {
  const objectStore = jest.fn()

  createOrUpdateDatabase({
    oldVersion: 0,
    target: {
      result: {
        createObjectStore: jest.fn(() => ({ createIndex: jest.fn() })),
        objectStoreNames: { contains: jest.fn().mockReturnValue(false) },
      },
      transaction: { objectStore },
    },
  })

  expect(objectStore).not.toHaveBeenCalled()
})

test('IndexedDB basic functions - createOrUpdateDatabase migrates an existing database', () => {
  const request = {}
  const put = jest.fn()
  const getAll = jest.fn(() => request)

  createOrUpdateDatabase({
    oldVersion: 1,
    target: {
      result: {
        createObjectStore: jest.fn(),
        objectStoreNames: { contains: jest.fn().mockReturnValue(true) },
      },
      transaction: { objectStore: jest.fn(() => ({ getAll, put })) },
    },
  })

  expect(getAll).toHaveBeenCalled()

  request.result = [{ id: 1, iv: 'iv', tag: 'tag', seed: 'seed' }]
  request.onsuccess()

  expect(put).toHaveBeenCalledWith({
    id: 1,
    iv: { btcIv: 'iv' },
    tag: { btcTag: 'tag' },
    seed: { btcEncryptedSeed: 'seed' },
    htlsSecrets: {},
  })
})

test('IndexedDB basic functions - openDatabase', async () => {
  const db = await openDatabase()
  expect(db).toBeDefined()
  expect(db.name).toBe(DATABASENAME)
  expect(db.objectStoreNames).toContain(ACCOUNTSSTORENAME)
  expect(db.version).toBe(SCHEMAVERSION)

  deleteDatabase()
  db.close()
})

test('IndexedDB basic functions - openDatabase error', async () => {
  const context = { error: () => context.onerror(new Error()) }
  const db = {
    open: () => {
      setTimeout(context.error, 1)
      return context
    },
  }

  await expect(async () => {
    await openDatabase(db)
  }).rejects.toBeInstanceOf(Error)
})

test('IndexedDB basic functions - createTransaction', async () => {
  const openedDB = {
    transaction: (storeName, mode) => {
      expect(storeName).toBeDefined()
      expect(mode).toBeDefined()
      return {}
    },
  }

  const transaction = await createTransaction(openedDB)
  expect(transaction.onerror).toBeInstanceOf(Function)
})

test('IndexedDB basic functions - createTransaction error', (done) => {
  const context = { error: () => context.onerror(new Error()) }
  const errorHandler = (error) => {
    expect(error).toBeInstanceOf(Error)
    done()
  }
  const openedDB = {
    transaction: (storeName, mode) => {
      expect(storeName).toBeDefined()
      expect(mode).toBeDefined()
      setTimeout(context.error, 1)
      return context
    },
  }

  createTransaction(openedDB, errorHandler)
})

test('IndexedDB basic functions - createTransaction error on console', (done) => {
  jest.spyOn(console, 'error').mockImplementation((error) => {
    expect(error).toBeInstanceOf(Error)
    console.error.mockRestore()
    done()
  })

  const context = { error: () => context.onerror(new Error()) }

  const openedDB = {
    transaction: (storeName, mode) => {
      expect(storeName).toBeDefined()
      expect(mode).toBeDefined()
      setTimeout(context.error, 1)
      return context
    },
  }

  createTransaction(openedDB)
})

test('IndexedDB basic functions - save', async () => {
  const context = {
    success: () => context.onsuccess({ target: { result: 1 } }),
  }

  const store = {
    add: (obj) => {
      expect(obj).toBeDefined()
      setTimeout(context.success, 1)
      return context
    },
  }

  const id = await save(store, {})
  expect(id).toBe(1)
})

test('IndexedDB basic functions - save error', async () => {
  const context = {
    error: () => context.onerror(new Error()),
  }

  const store = {
    add: (obj) => {
      expect(obj).toBeDefined()
      setTimeout(context.error, 1)
      return context
    },
  }

  await expect(async () => {
    await save(store, {})
  }).rejects.toThrow()
})

test('IndexedDB basic functions - get', async () => {
  const context = {
    success: () => context.onsuccess({ target: { result: {} } }),
  }

  const store = {
    get: (obj) => {
      expect(obj).toBeDefined()
      setTimeout(context.success, 1)
      return context
    },
  }

  const id = await get(store, 1)
  expect(id).toBeDefined()
})

test('IndexedDB basic functions - get error', async () => {
  const context = {
    error: () => context.onerror(new Error()),
  }

  const store = {
    get: (index) => {
      expect(index).toBeDefined()
      setTimeout(context.error, 1)
      return context
    },
  }

  await expect(async () => {
    await get(store, {})
  }).rejects.toThrow()
})

test('IndexedDB basic functions - save and get real', async () => {
  const accounts = await loadAccounts()

  const id = await save(accounts, { name: 'testing' })
  expect(id).toBe(1)

  const account = await get(accounts, id)
  expect(account.id).toBe(1)

  deleteDatabase()
})

test('IndexedDB basic functions - getAll', async () => {
  const accounts = await loadAccounts()
  let all = await getAll(accounts)
  expect(all.length).toBe(0)

  const id = await save(accounts, { name: 'testing' })
  expect(id).toBe(1)

  all = await getAll(accounts)
  expect(all.length).toBe(1)

  deleteDatabase()
})

test('IndexedDB basic functions - getAll error', async () => {
  const context = {
    error: () => context.onerror(new Error()),
  }

  const store = {
    getAll: () => {
      setTimeout(context.error, 1)
      return context
    },
  }

  await expect(async () => {
    await getAll(store)
  }).rejects.toThrow()
})

// ── restoreAccountFromJSON walletType whitelist ──────────────────────────
// A restored record's walletType is resolved through BTC_ADDRESS_TYPE_MAP
// on unlock/sign/delete; an out-of-enum value from a crafted backup file
// makes the imported account permanently un-unlockable and un-deletable.
const validBackupJson = {
  id: 7,
  iv: {
    btcIv: 'a1b2c3d4e5f60718293a4b5c',
    mlTestnetPrivKeyIv: 'b2c3d4e5f60718293a4b5c6d',
    mlMainnetPrivKeyIv: 'c3d4e5f60718293a4b5c6d7e',
  },
  name: 'Backup Wallet',
  salt: 'd4e5f60718293a4b5c6d7e8f9a0b1c2d',
  tag: {
    btcTag: 'e5f60718293a4b5c6d7e8f9a0b1c2d3e',
    mlTestnetPrivKeyTag: 'f60718293a4b5c6d7e8f9a0b1c2d3e4f',
    mlMainnetPrivKeyTag: '0718293a4b5c6d7e8f9a0b1c2d3e4f5a',
  },
  seed: {
    btcEncryptedSeed: '18293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    encryptedMlMainnetPrivateKey: '293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    encryptedMlTestnetPrivateKey: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
  walletType: BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT,
  walletsToCreate: ['btc', 'ml'],
}

test('IndexedDB restoreAccountFromJSON - accepts every supported walletType', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    const supportedTypes = Object.values(BTC_ADDRESS_TYPE_ENUM)

    for (const [index, walletType] of supportedTypes.entries()) {
      await expect(
        restoreAccountFromJSON({
          ...validBackupJson,
          id: index + 1,
          walletType,
        }),
      ).resolves.toBeUndefined()
    }

    const accounts = await loadAccounts()
    const stored = await getAll(accounts)
    expect(stored.map((account) => account.walletType)).toEqual(supportedTypes)

    deleteDatabase()
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB restoreAccountFromJSON - rejects prototype-named walletType and stores nothing', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await expect(
      restoreAccountFromJSON({
        ...validBackupJson,
        walletType: 'constructor',
      }),
    ).rejects.toThrow('unsupported "walletType"')

    const accounts = await loadAccounts()
    await expect(getAll(accounts)).resolves.toEqual([])

    deleteDatabase()
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB restoreAccountFromJSON - rejects out-of-enum walletType strings', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    // 'ml' is a chain label, not a BTC address type: it would resolve to
    // undefined in BTC_ADDRESS_TYPE_MAP exactly like a prototype name
    await expect(
      restoreAccountFromJSON({ ...validBackupJson, walletType: 'ml' }),
    ).rejects.toThrow('unsupported "walletType"')
    await expect(
      restoreAccountFromJSON({ ...validBackupJson, walletType: '__proto__' }),
    ).rejects.toThrow('unsupported "walletType"')

    const accounts = await loadAccounts()
    await expect(getAll(accounts)).resolves.toEqual([])

    deleteDatabase()
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB restoreAccountFromJSON - rejects non-string walletType', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await expect(
      restoreAccountFromJSON({ ...validBackupJson, walletType: 5 }),
    ).rejects.toThrow('unsupported "walletType"')

    const accounts = await loadAccounts()
    await expect(getAll(accounts)).resolves.toEqual([])

    deleteDatabase()
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB restoreAccountFromJSON - restores legacy backups without walletType', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    // Records predating the walletType field export verbatim without it;
    // restore must accept them and store the nativeSegwit default every
    // consumer already falls back to at unlock time.
    const legacyBackup = { ...validBackupJson }
    delete legacyBackup.walletType

    await expect(restoreAccountFromJSON(legacyBackup)).resolves.toBeUndefined()

    const accounts = await loadAccounts()
    const stored = await getAll(accounts)
    expect(stored).toHaveLength(1)
    expect(stored[0].walletType).toBe(BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT)

    deleteDatabase()
  } finally {
    errorSpy.mockRestore()
  }
})

test('IndexedDB restoreAccountFromJSON - closes the connection when restore fails', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await expect(
      restoreAccountFromJSON({ ...validBackupJson, walletType: 5 }),
    ).rejects.toThrow('unsupported "walletType"')

    // A leaked connection would block deleteDatabase forever; it must
    // complete once the failed restore released its connection.
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DATABASENAME)
      request.onsuccess = resolve
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('connection leaked'))
    })
  } finally {
    errorSpy.mockRestore()
  }
})
