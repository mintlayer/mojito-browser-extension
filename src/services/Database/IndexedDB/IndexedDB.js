import {
  ACCOUNT_MIGRATIONS,
  migrateAccount,
} from 'src/services/Database/migrations/migrations'

const glob = typeof window !== 'undefined' ? window : self
/* istanbul ignore next */
const IDB =
  glob.indexedDB ||
  glob.mozIndexedDB ||
  glob.webkitIndexedDB ||
  glob.msIndexedDB

const SCHEMAVERSION = ACCOUNT_MIGRATIONS.length + 1
const DATABASENAME = 'mojito'
const ACCOUNTSSTORENAME = 'accounts'

const createOrUpdateDatabase = (event) => {
  const db = event.target.result
  const { oldVersion } = event

  if (!db.objectStoreNames.contains(ACCOUNTSSTORENAME)) {
    const objectStore = db.createObjectStore(ACCOUNTSSTORENAME, {
      keyPath: 'id',
      autoIncrement: true,
    })

    // Create an index on the 'name' property
    objectStore.createIndex('name', 'name', { unique: false })
  }

  if (oldVersion === 0) return

  // Apply migrations here, inside the upgrade transaction
  const store = event.target.transaction.objectStore(ACCOUNTSSTORENAME)
  const request = store.getAll()

  request.onsuccess = () => {
    request.result.forEach((account) => {
      const migrated = migrateAccount(account, oldVersion)

      if (migrated !== account) store.put(migrated)
    })
  }
}

const openDatabase = (DB = IDB) => {
  return new Promise((resolve, reject) => {
    const request = DB.open(DATABASENAME, SCHEMAVERSION)

    // Reject with the underlying error, not the raw event.
    request.onerror = (event) => reject(event?.target?.error ?? event)
    // With popup + sidepanel + tab contexts sharing the DB, a version
    // upgrade can stall forever on a connection that never closes.
    request.onblocked = () =>
      reject(new Error('Database upgrade blocked by another connection'))
    request.onupgradeneeded = createOrUpdateDatabase
    request.onsuccess = (event) => resolve(event.target.result)
  })
}

const createTransaction = async (openedDb, onError) => {
  return new Promise((resolve) => {
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
    onError?.(error)
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

    await clear(store)

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

const remove = (store, key) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.delete(key)
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const clear = (store) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.clear()
    dbOperation.onsuccess = ({ target: { result } }) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const deleteAccount = async (accountId, onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = db.transaction([ACCOUNTSSTORENAME], 'readwrite')
    const store = transaction.objectStore(ACCOUNTSSTORENAME)

    await remove(store, accountId)

    db.close()
  } catch (error) {
    onError && onError(error)
    console.error(error)
  }
}

const saveDbToJSON = async (onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = db.transaction([ACCOUNTSSTORENAME], 'readwrite')
    const store = transaction.objectStore(ACCOUNTSSTORENAME)
    const accounts = await getAll(store)

    const json = JSON.stringify(accounts)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mojito.json'
    a.click()

    db.close()
  } catch (error) {
    onError && onError(error)
    console.error(error)
  }
}

const getAccountJSON = async (accountId, onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = db.transaction([ACCOUNTSSTORENAME], 'readwrite')
    const store = transaction.objectStore(ACCOUNTSSTORENAME)
    const account = await get(store, accountId)
    const json = JSON.stringify(account)

    db.close()
    return json
  } catch (error) {
    onError && onError(error)
    console.error(error)
  }
}

const restoreAccountFromJSON = async (json, onError, DB = IDB) => {
  try {
    const db = await openDatabase(DB)
    const transaction = db.transaction([ACCOUNTSSTORENAME], 'readwrite')
    const store = transaction.objectStore(ACCOUNTSSTORENAME)
    const accounts = await getAll(store)
    const accountsIds = accounts.map((account) => account.id)

    // Validate the shape BEFORE computing the collision-free id.
    if (
      !json ||
      typeof json !== 'object' ||
      !Object.prototype.hasOwnProperty.call(json, 'id') ||
      typeof json.id !== 'number' ||
      !Number.isFinite(json.id)
    ) {
      throw new Error(
        'The JSON object does not contain a valid numeric "id" property.',
      )
    }

    const restoringAccount = { ...json }

    // Check if restoring account id already exists
    if (accountsIds.includes(restoringAccount.id)) {
      // Generate a new id for the restoring account
      const maxId = accountsIds.reduce(
        (max, id) => (typeof id === 'number' && id > max ? id : max),
        0,
      )
      restoringAccount.id = maxId + 1
    }

    // Await the write: a failed restore must reject so the caller never
    // reports success on a backup the user may have just discarded.
    await new Promise((resolve, reject) => {
      const request = store.add(restoringAccount)

      request.onsuccess = () => {
        console.log('Account successfully added to the store.')
        resolve()
      }
      request.onerror = () => {
        const error = request.error ?? new Error('Failed to add account')
        reject(error)
      }
      transaction.onerror = () => {
        const error = transaction.error ?? new Error('Transaction error')
        reject(error)
      }
    })

    db.close()
  } catch (error) {
    onError && onError(error)
    console.error('Error restoring account from JSON:', error)
    throw error
  }
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
  deleteAccount,
  saveDbToJSON,
  getAccountJSON,
  restoreAccountFromJSON,
}
