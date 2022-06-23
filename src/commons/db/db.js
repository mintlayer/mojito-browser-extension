/* istanbul ignore next */
const IDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
const SCHEMAVERSION = 1
const DATABASENAME = 'mojito'
const ACCOUNTSSTORENAME = 'accounts'

const createOrUpdateDatabase = (event) => {
  const db = event.target.result
  const objectStore = db.createObjectStore(ACCOUNTSSTORENAME, { keyPath: 'id', autoIncrement : true })

  objectStore.createIndex('name', 'name', { unique: false })
}

const openDatabase = (DB = IDB) => {
  return new Promise((resolve, reject) => {
    const request = DB.open(DATABASENAME, SCHEMAVERSION)

    request.onerror = event => reject(event)
    request.onupgradeneeded = createOrUpdateDatabase
    request.onsuccess = (event) => resolve(event.target.result)
  })
}

const createTransaction = async (openedDb, onError) => {
  return new Promise((resolve, reject) => {
    const transaction = openedDb.transaction([ACCOUNTSSTORENAME], 'readwrite')

    transaction.onerror = event => onError ? onError(event) : console.error(event)
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

const save = (store, entity) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.add(entity)
    dbOperation.onsuccess = ({target: {result}}) => resolve(result)
    dbOperation.onerror = (error) => reject(error)
  })
}

const get = (store, index) => {
  return new Promise((resolve, reject) => {
    const dbOperation = store.get(index)
    dbOperation.onsuccess = ({target: {result}}) => resolve(result)
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
  get
}
