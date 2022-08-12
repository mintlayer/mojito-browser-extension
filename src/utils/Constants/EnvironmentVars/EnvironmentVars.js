const BTC_NETWORK = process.env.REACT_APP_BTC_NETWORK
const USE_WEB_WORKERS = process.env.NODE_ENV !== 'test'
const IS_PROD_ENV = process.env.NODE_ENV === 'production'

export { BTC_NETWORK, USE_WEB_WORKERS, IS_PROD_ENV }
