import { DATABASENAME } from '/src/services/Database/IndexedDB/IndexedDB.js'

const deleteDatabase = () => indexedDB.deleteDatabase(DATABASENAME)

export default { deleteDatabase }
