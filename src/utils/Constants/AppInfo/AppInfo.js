import { IndexedDB } from '@Databases'

const appAccounts = async () => {
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)
  return accounts
}

const decimalSeparator = ','
const thousandsSeparator = '.'
const amountRegex = /^\d+(,\d+)?$/
const minEntropyLength = 192
const DEFAULT_WALLETS_TO_CREATE = ['btc']
const ML_ATOMS_PER_COIN = 100000000000
const DEFAULT_ML_WALLET_OFFSET = 21
const UNCONFIRMED_TRANSACTION_NAME = 'ml_unconfirmed_transaction'
const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
}
const walletTypes = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    value: 'btc',
  },
  {
    name: 'Mintlayer',
    symbol: 'ML',
    value: 'ml',
  },
]

export {
  appAccounts,
  decimalSeparator,
  thousandsSeparator,
  amountRegex,
  minEntropyLength,
  walletTypes,
  DEFAULT_WALLETS_TO_CREATE,
  NETWORK_TYPES,
  ML_ATOMS_PER_COIN,
  DEFAULT_ML_WALLET_OFFSET,
  UNCONFIRMED_TRANSACTION_NAME,
}
