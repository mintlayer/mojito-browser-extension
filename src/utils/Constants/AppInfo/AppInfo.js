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
// Digits with an optional decimal part only — rejects exponent notation
// ('1e3') and garbage separators ('1x5'); the '.' is escaped so it cannot
// match any character.
const amountRegex = /^\d+(\.\d+)?$/
const DEFAULT_WALLETS_TO_CREATE = ['btc', 'ml']
const ML_ATOMS_PER_COIN = 100000000000
const ML_DECIMALS = 11
const BTC_DECIMALS = 8
const DEFAULT_ML_WALLET_OFFSET = 21
const APPROPRIATE_COST_PER_BLOCK = 190
const APPROPRIATE_MARGIN_RATIO_PER_THOUSAND = 80
const UNCONFIRMED_TRANSACTION_NAME = 'ml_unconfirmed_transaction'
const MAX_UPLOAD_FILE_SIZE = 2 * 1024 // 2 kb
const SIGNED_MESSAGE_STRING_SEPARATOR = '.'
const BATCH_REQUEST_MINTLAYER_LIMIT = 150
const BATCH_REQUEST_BITCOIN_LIMIT = 10
const ML_EXPLORER_MAINNET = 'https://explorer.mintlayer.org/'
const ML_EXPLORER_TESTNET = 'https://lovelace.explorer.mintlayer.org/'
const BTC_EXPLORER_MAINNET = 'https://blockstream.info/'
const BTC_EXPLORER_TESTNET = 'https://explorer.gomaestro.org/bitcoin/testnet/'
const PRIVACY_POLICY_URL =
  'https://www.mintlayer.org/tc/mojito-browser-extension-privacy-policy/'
const CONTACT_US_URL = 'mailto:support@mintlayer.org'
const BTC_DEFAULT_ADDRESSES_BATCH = 3
const BTC_MAX_TRANSACTION_FEE = 100000 // 0.001 BTC
const BTC_MAX_FEERATE = 200
const COLOR_LIST = {
  btc: '#F7931A',
  ml: '#7ED0D7',
}

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
  NFT_SEND: 'nft',
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

const WALLET_NAME_ERROR = 'The wallet name should have at least 4 characters.'
const WALLET_PASSWORD_ERROR = [
  'Your password should have at least 8 characters.',
  'Also it should have a lowercase letter, an uppercase letter, a digit, and a special character.',
]

const MAX_ML_FEE = 500000000000 // 5 ML in atoms
const REFRESH_INTERVAL = 1000 * 60 * 2 // one per two minutes

export {
  appAccounts,
  decimalSeparator,
  thousandsSeparator,
  amountRegex,
  walletTypes,
  DEFAULT_WALLETS_TO_CREATE,
  NETWORK_TYPES,
  ML_ATOMS_PER_COIN,
  ML_DECIMALS,
  BTC_DECIMALS,
  DEFAULT_ML_WALLET_OFFSET,
  UNCONFIRMED_TRANSACTION_NAME,
  ML_TRANSACTION_TYPES,
  ML_TRANSACTION_MODES,
  MAX_ML_FEE,
  APPROPRIATE_COST_PER_BLOCK,
  APPROPRIATE_MARGIN_RATIO_PER_THOUSAND,
  REFRESH_INTERVAL,
  MAX_UPLOAD_FILE_SIZE,
  SIGNED_MESSAGE_STRING_SEPARATOR,
  BATCH_REQUEST_MINTLAYER_LIMIT,
  BATCH_REQUEST_BITCOIN_LIMIT,
  ML_EXPLORER_MAINNET,
  ML_EXPLORER_TESTNET,
  BTC_EXPLORER_MAINNET,
  BTC_EXPLORER_TESTNET,
  BTC_DEFAULT_ADDRESSES_BATCH,
  BTC_MAX_TRANSACTION_FEE,
  BTC_MAX_FEERATE,
  COLOR_LIST,
  WALLET_NAME_ERROR,
  WALLET_PASSWORD_ERROR,
  PRIVACY_POLICY_URL,
  CONTACT_US_URL,
}
