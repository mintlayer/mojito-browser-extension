const BTC_NETWORK = process.env.BTC_NETWORK
const USE_WEB_WORKERS = process.env.NODE_ENV !== 'test'

export {
  BTC_NETWORK,
  USE_WEB_WORKERS
}
