import { accountsMigration_01_add_mlwallet_private_keys } from '../migrations/migrations'
// eslint-disable-next-line no-restricted-globals
const glob = typeof window !== 'undefined' ? window : self
/* istanbul ignore next */
const IDB =
  glob.indexedDB ||
  glob.mozIndexedDB ||
  glob.webkitIndexedDB ||
  glob.msIndexedDB

const SCHEMAVERSION = 2
const DATABASENAME = 'mojito'
const ACCOUNTSSTORENAME = 'accounts'

const createOrUpdateDatabase = (event) => {
  const db = event.target.result

  if (!db.objectStoreNames.contains(ACCOUNTSSTORENAME)) {
    const objectStore = db.createObjectStore(ACCOUNTSSTORENAME, {
      keyPath: 'id',
      autoIncrement: true,
    })

    // Create an index on the 'name' property
    objectStore.createIndex('name', 'name', { unique: false })
  }
  // Apply migrations here
  accountsMigration_01_add_mlwallet_private_keys()
}

const openDatabase = (DB = IDB) => {
  return new Promise((resolve, reject) => {
    const request = DB.open(DATABASENAME, SCHEMAVERSION)

    request.onerror = (event) => reject(event)
    request.onupgradeneeded = createOrUpdateDatabase
    request.onsuccess = (event) => resolve(event.target.result)
  })
}

const createTransaction = async (openedDb, onError) => {
  return new Promise((resolve, reject) => {
    const transaction = openedDb.transaction([ACCOUNTSSTORENAME], 'readwrite')

    transaction.onerror = (event) =>
      onError ? onError(event) : console.error(event)
    resolve(transaction)
  })
}

const loadAccounts = async (onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = await createTransaction(db, onError)
    const store = transaction.objectStore(ACCOUNTSSTORENAME)
    db.close()
    return store
  } catch (error) {
    onError(error)
  }
}

const saveAccounts = async (accounts, onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const oldAccounts = await loadAccounts()

    for (const account of accounts) {
      await update(oldAccounts, account)
    }

    db.close()
  } catch (error) {
    onError && onError(error)
    console.error(error)
  }
}

const clearDatabase = async (onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = db.transaction([ACCOUNTSSTORENAME], 'readwrite')
    const store = transaction.objectStore(ACCOUNTSSTORENAME)

    const request = store.clear()
    request.onsuccess = function (event) {
      console.log('All records have been removed from the store.')
    }
    request.onerror = function (event) {
      console.error('Failed to clear object store:', event.target.errorCode)
    }

    db.close()
  } catch (error) {
    onError && onError(error)
    console.error(error)
  }
}

const save = (store, entity) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.add(entity)
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const get = (store, index) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.get(index)
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const getAll = (store) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.getAll()
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const update = (store, entity) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.put(entity)
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

export {
  DATABASENAME,
  ACCOUNTSSTORENAME,
  SCHEMAVERSION,
  createOrUpdateDatabase,
  openDatabase,
  createTransaction,
  loadAccounts,
  save,
  saveAccounts,
  clearDatabase,
  get,
  getAll,
  update,
}
