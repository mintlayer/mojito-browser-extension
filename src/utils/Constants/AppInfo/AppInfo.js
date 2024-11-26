import { IndexedDB } from '@Databases'
import { ReactComponent as LogoBTC } from '@Assets/images/btc-logo.svg'
import { ReactComponent as LogoML } from '@Assets/images/logo.svg'

const appAccounts = async () => {
  const store = await IndexedDB.loadAccounts()
  const accounts = await IndexedDB.getAll(store)
  return accounts
}

const decimalSeparator = '.'
const thousandsSeparator = ' '
const amountRegex = /^\d+(.\d+)?$/
const minEntropyLength = 192
const DEFAULT_WALLETS_TO_CREATE = ['btc']
const ML_ATOMS_PER_COIN = 100000000000
const DEFAULT_ML_WALLET_OFFSET = 21
const APPROPRIATE_COST_PER_BLOCK = 190
const APPROPRIATE_MARGIN_RATIO_PER_THOUSAND = 80
const UNCONFIRMED_TRANSACTION_NAME = 'ml_unconfirmed_transaction'
const APP_LOCAL_STORAGE_CUSTOM_SERVERS = 'customAPIServers'
const MAX_UPLOAD_FILE_SIZE = 2 * 1024 // 2 kb
const SIGNED_MESSAGE_STRING_SEPARATOR = '.'

const NETWORK_TYPES = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
}
const ML_TRANSACTION_TYPES = {
  TRANSACTION: 'Transfer',
  CREATE_DELEGATION: 'CreateDelegationId',
  STAKING: 'DelegateStaking',
}
const ML_TRANSACTION_MODES = {
  TRANSACTION: 'transaction',
  DELEGATION: 'delegation',
  STAKING: 'staking',
  WITHDRAW: 'withdraw',
}
const walletTypes = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    value: 'btc',
    icon: <LogoBTC />,
  },
  {
    name: 'Mintlayer',
    symbol: 'ML',
    value: 'ml',
    icon: <LogoML />,
  },
]

const WALLETS_NAVIGATION = [
  {
    id: '1',
    label: 'Bitcoin',
    value: 'bitcoin',
    type: 'menu',
    actions: [
      {
        id: '1.1',
        name: 'Open Wallet',
        link: '/wallet/Bitcoin',
      },
      {
        id: '1.2',
        name: 'Send Transaction',
        link: '/wallet/Bitcoin/send-transaction',
      },
    ],
  },
  {
    id: '2',
    label: 'Mintlayer',
    value: 'mintlayer',
    type: 'menu',
    actions: [
      {
        id: '2.1',
        name: 'Open Wallet',
        link: '/wallet/Mintlayer',
      },
      {
        id: '2.2',
        name: 'Send Transaction',
        link: '/wallet/Mintlayer/send-transaction',
      },
      {
        id: '2.3',
        name: 'Staking',
        link: '/wallet/Mintlayer/staking',
      },
      {
        id: '2.4',
        name: 'Sign/Verify Message',
        link: '/wallet/Mintlayer/sign-message',
      },
      {
        id: '2.5',
        name: 'Custom Transaction',
        link: '/wallet/Mintlayer/custom-output',
      },
    ],
  },
]

const MAX_ML_FEE = 500000000000
const REFRESH_INTERVAL = 1000 * 60 // one per minute

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
  ML_TRANSACTION_TYPES,
  ML_TRANSACTION_MODES,
  MAX_ML_FEE,
  APPROPRIATE_COST_PER_BLOCK,
  APPROPRIATE_MARGIN_RATIO_PER_THOUSAND,
  APP_LOCAL_STORAGE_CUSTOM_SERVERS,
  REFRESH_INTERVAL,
  MAX_UPLOAD_FILE_SIZE,
  WALLETS_NAVIGATION,
  SIGNED_MESSAGE_STRING_SEPARATOR,
}
