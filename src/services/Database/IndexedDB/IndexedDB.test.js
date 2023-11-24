import {
  DATABASENAME,
  ACCOUNTSSTORENAME,
  SCHEMAVERSION,
  createOrUpdateDatabase,
  createTransaction,
  loadAccounts,
  openDatabase,
  save,
  get,
  getAll,
} from './IndexedDB'

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
  }).rejects.toThrowError()
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
  }).rejects.toThrowError()
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
  }).rejects.toThrowError()
})
