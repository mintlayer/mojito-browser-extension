const ELECTRUM_URL = 'http://51.158.172.176:3001'

const ELECTRUM_ENDPOINTS = {
  GET_LAST_BLOCK_HASH: '/blocks/tip/hash',
  GET_TRANSACTION_DATA: '/tx/:txid',
  GET_TRANSACTION_STATUS: '/tx/:txid/status',
  GET_ADDRESS_TRANSACTIONS: '/address/:address/txs',
  GET_ADDRESS: '/address/:address',
  GET_ADDRESS_UTXO: '/address/:address/utxo',
}

const requestElectrum = async (endpoint, data = null, request = fetch) => {
  try {
    const result = await request(ELECTRUM_URL + endpoint)
    if (!result.ok) throw new Error('Request not successful')
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    console.dir(error)
    throw error
  }
}

const getLastBlockHash = () =>
  requestElectrum(ELECTRUM_ENDPOINTS.GET_LAST_BLOCK_HASH)
const getTransactionData = (txid) =>
  requestElectrum(
    ELECTRUM_ENDPOINTS.GET_TRANSACTION_DATA.replace(':txid', txid),
  )
const getTransactionStatus = (txid) =>
  requestElectrum(
    ELECTRUM_ENDPOINTS.GET_TRANSACTION_STATUS.replace(':txid', txid),
  )
const getAddressTransactions = (address) =>
  requestElectrum(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_TRANSACTIONS.replace(':address', address),
  )
const getAddress = (address) =>
  requestElectrum(ELECTRUM_ENDPOINTS.GET_ADDRESS.replace(':address', address))
const getAddressUtxo = (address) =>
  requestElectrum(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_UTXO.replace(':address', address),
  )

export {
  getLastBlockHash,
  getTransactionData,
  getTransactionStatus,
  getAddressTransactions,
  getAddress,
  getAddressUtxo,
  requestElectrum,
  ELECTRUM_ENDPOINTS,
  ELECTRUM_URL,
}
