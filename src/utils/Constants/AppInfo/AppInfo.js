import { IndexedDB } from '@Databases'

const appAccounts = async () => {
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)
  return accounts
}

const decimalSeparator = ','
const thousandsSeparator = '.'
const minEntropyLength = 192

export { appAccounts, decimalSeparator, thousandsSeparator, minEntropyLength }
