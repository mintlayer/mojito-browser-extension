import { IndexedDB } from '@Databases'

const appAccounts = async () => {
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)
  return accounts
}

const decimalSeparator = ','
const thousandsSeparator = '.'
const minEntropyLength = 192
const walletTypes = [
  {
    name: 'Bitcoin (BTC)',
    value: 'btc',
  },
  {
    name: 'Mintlayer (ML)',
    value: 'ml',
    disabled: true,
  },
]

export {
  appAccounts,
  decimalSeparator,
  thousandsSeparator,
  minEntropyLength,
  walletTypes,
}
