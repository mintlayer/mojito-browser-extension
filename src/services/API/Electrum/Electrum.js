import { EnvVars } from '@Constants'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'

const ELECTRUM_ENDPOINTS = {
  GET_LAST_BLOCK_HASH: '/blocks/tip/hash',
  GET_TRANSACTION_DATA: '/tx/:txid',
  GET_TRANSACTION_HEX: '/tx/:txid/hex',
  GET_TRANSACTION_STATUS: '/tx/:txid/status',
  GET_ADDRESS_TRANSACTIONS: '/address/:address/txs',
  GET_ADDRESS: '/address/:address',
  GET_ADDRESS_UTXO: '/address/:address/utxo',
  GET_LAST_BLOCK_HEIGHT: '/blocks/tip/height',
  GET_FEES_ESTIMATES: '/fee-estimates',
  POST_TRANSACTION: '/tx',
}

const abortControllers = new Map()

const requestElectrum = async (url, body = null, request = fetch) => {
  const method = body ? 'POST' : 'GET'
  const controller = new AbortController()
  abortControllers.set(url, controller)

  try {
    const result = await request(url, { method, body })
    if (!result.ok) throw new Error('Request not successful')
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    console.error(error)
    throw error
  } finally {
    abortControllers.delete(url)
  }
}

const tryServers = async (endpoint, body = null) => {
  const networkType = LocalStorageService.getItem('networkType')
  const customElectrumServerList = LocalStorageService.getItem(
    AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
  )

  const customServer = customElectrumServerList
    ? networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? customElectrumServerList.bitcoin_testnet
      : customElectrumServerList.bitcoin_mainnet
    : null

  const defaultElectrumServes =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? EnvVars.TESTNET_ELECTRUM_SERVERS
      : EnvVars.MAINNET_ELECTRUM_SERVERS

  const combinedElectrumServers = customServer
    ? [customServer, ...defaultElectrumServes]
    : [...defaultElectrumServes]

  for (let i = 0; i < combinedElectrumServers.length; i++) {
    try {
      const response = await requestElectrum(
        combinedElectrumServers[i] + endpoint,
        body,
      )
      return response
    } catch (error) {
      console.warn(
        `${combinedElectrumServers[i] + endpoint} request failed: `,
        error,
      )
      if (i === combinedElectrumServers.length - 1) {
        throw error
      }
    }
  }
}

const getLastBlockHash = () =>
  tryServers(ELECTRUM_ENDPOINTS.GET_LAST_BLOCK_HASH)

const getTransactionData = (txid) =>
  tryServers(ELECTRUM_ENDPOINTS.GET_TRANSACTION_DATA.replace(':txid', txid))

const getTransactionHex = (txid) =>
  tryServers(ELECTRUM_ENDPOINTS.GET_TRANSACTION_HEX.replace(':txid', txid))

const getTransactionStatus = (txid) =>
  tryServers(ELECTRUM_ENDPOINTS.GET_TRANSACTION_STATUS.replace(':txid', txid))

const getAddressTransactions = (address) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_TRANSACTIONS.replace(':address', address),
  )

const getAddress = (address) =>
  tryServers(ELECTRUM_ENDPOINTS.GET_ADDRESS.replace(':address', address))

const getAddressUtxo = (address) => {
  return tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_UTXO.replace(':address', address),
  )
}

const getLastBlockHeight = () =>
  tryServers(ELECTRUM_ENDPOINTS.GET_LAST_BLOCK_HEIGHT)

const getFeesEstimates = async () => {
  const isTestnet =
    LocalStorageService.getItem('networkType') === AppInfo.NETWORK_TYPES.TESTNET
  if (isTestnet) {
    const { fees } = await import('@TestData')
    return JSON.stringify(fees)
  }
  return tryServers(ELECTRUM_ENDPOINTS.GET_FEES_ESTIMATES)
}

const broadcastTransaction = (transaction) =>
  tryServers(ELECTRUM_ENDPOINTS.POST_TRANSACTION, transaction)

const cancelAllRequests = () => {
  abortControllers.forEach((controller) => controller.abort())
  abortControllers.clear()
}

const getWalletAddressesInfo = async (addresses) => {
  const results = await Promise.all(
    addresses.map((address) => getAddress(address)),
  )
  return results.map((data) => {
    return JSON.parse(data)
  })
}

export {
  getLastBlockHash,
  getTransactionData,
  getTransactionStatus,
  getTransactionHex,
  getAddressTransactions,
  getAddress,
  getAddressUtxo,
  requestElectrum,
  getLastBlockHeight,
  getFeesEstimates,
  broadcastTransaction,
  cancelAllRequests,
  getWalletAddressesInfo,
  ELECTRUM_ENDPOINTS,
}
