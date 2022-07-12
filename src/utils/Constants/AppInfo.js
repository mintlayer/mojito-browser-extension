import { getAll, loadAccounts } from '../../services/Database/IndexedDB'

const appAccounts = async () => {
  const store = await loadAccounts()
  const accounts = await getAll(store)
  return accounts
}

export { appAccounts }
