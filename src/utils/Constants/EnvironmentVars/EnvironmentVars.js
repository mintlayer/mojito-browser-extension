const BTC_NETWORK = process.env.REACT_APP_BTC_NETWORK
const USE_WEB_WORKERS = process.env.NODE_ENV !== 'test'
const IS_PROD_ENV = process.env.NODE_ENV === 'production'
const MAINNET_ELECTRUM_SERVERS = process.env.MAINNET_ELECTRUM_SERVERS.split(',')
const TESTNET_ELECTRUM_SERVERS = process.env.TESTNET_ELECTRUM_SERVERS.split(',')
// TODO: change ML server list when API is ready
const MINTLAYER_SERVERS = process.env.MINTLAYER_SERVERS.split(',')

export {
  BTC_NETWORK,
  USE_WEB_WORKERS,
  IS_PROD_ENV,
  MAINNET_ELECTRUM_SERVERS,
  TESTNET_ELECTRUM_SERVERS,
  MINTLAYER_SERVERS,
}
