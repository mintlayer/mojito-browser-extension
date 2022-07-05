import { getAll, loadAccounts } from '../db/db'

const appAccounts = async () => {
  const store = await loadAccounts()
  const accounts = await getAll(store)
  return accounts
}

export { appAccounts }
