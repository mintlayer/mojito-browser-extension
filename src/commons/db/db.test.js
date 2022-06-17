import {
  DATABASENAME,
  ACCOUNTSSTORENAME,
  SCHEMAVERSION,
  createOrUpdateDatabase,
  createTransaction,
  loadAccounts,
  openDatabase
} from './db'

const deleteDatabase = () => indexedDB.deleteDatabase(DATABASENAME)

test('IndexedDB basic functions', async () => {
  const accountsStore = await loadAccounts()

  expect(accountsStore._name).toBe('accounts')
  expect(accountsStore.indexNames[0]).toBe('name')
  expect(accountsStore.keyPath).toBe('id')

  deleteDatabase()
})

test('IndexedDB basic functions - error', async () => {
  const onError = (event) => expect(event).toBeInstanceOf(Error)
  await loadAccounts(onError, null)
})

test('IndexedDB basic functions - createOrUpdateDatabase', async () => {
  const createIndex = jest.fn((name, keyPath, options) => {
    expect(name).not.toBeFalsy()
    expect(keyPath).not.toBeFalsy()
    expect(Object.keys(options).length).toBeGreaterThan(0)
  })

  const createObjectStore = jest.fn((storeName, options)=> {
    expect(storeName).not.toBeFalsy()
    expect(Object.keys(options)).toContain('keyPath')

    return { createIndex }
  })

  const event = {
    target: {
      result: { createObjectStore }
    }
  }

  createOrUpdateDatabase(event)
})

test('IndexedDB basic functions - openDatabase', async () => {
  const db = await openDatabase()
  expect(db).not.toBeFalsy()
  expect(db.name).toBe(DATABASENAME)
  expect(db.objectStoreNames).toContain(ACCOUNTSSTORENAME)
  expect(db.version).toBe(SCHEMAVERSION)

  deleteDatabase()
})

test('IndexedDB basic functions - openDatabase error', async () => {
  const context = { error: () => context.onerror(new Error()) }
  const db = {
    open: () => {
      setTimeout(context.error, 1)
      return context
    }
  }

  await expect(async () => {
    await openDatabase(db)
  }).rejects.toBeInstanceOf(Error)
})

test('IndexedDB basic functions - createTransaction error', (done)=> {
  const context = { error: () => context.onerror(new Error()) }
  const errorHandler = (error) => {
    expect(error).toBeInstanceOf(Error)
    done()
  }
  const openedDB = {
    transaction: (storeName, mode) => {
      expect(storeName).not.toBeFalsy()
      expect(mode).not.toBeFalsy()
      setTimeout(context.error, 1)
      return context
    }
  }

  createTransaction(openedDB, errorHandler)
})

test('IndexedDB basic functions - createTransaction error on console', (done)=> {
  jest.spyOn(console, 'error')
    .mockImplementation((error) => {
      expect(error).toBeInstanceOf(Error)
      console.error.mockRestore()
      done()
  })

  const context = { error: () => context.onerror(new Error()) }

  const openedDB = {
    transaction: (storeName, mode) => {
      expect(storeName).not.toBeFalsy()
      expect(mode).not.toBeFalsy()
      setTimeout(context.error, 1)
      return context
    }
  }

  createTransaction(openedDB)
})
