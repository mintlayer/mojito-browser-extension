import { EnvVars } from '@Constants'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'
import { isAbortError } from 'src/utils/Helpers/AbortError/AbortError'

const ELECTRUM_ENDPOINTS = {
  GET_LAST_BLOCK_HASH: '/blocks/tip/hash',
  GET_TRANSACTION_DATA: '/tx/:txid',
  GET_TRANSACTION_HEX: '/tx/:txid/hex',
  GET_TRANSACTION_STATUS: '/tx/:txid/status',
  GET_ADDRESS_TRANSACTIONS: '/address/:address/txs',
  GET_ADDRESS_MEMPOOL_TRANSACTIONS: '/address/:address/txs/mempool',
  GET_ADDRESS: '/address/:address',
  GET_ADDRESS_UTXO: '/address/:address/utxo',
  GET_LAST_BLOCK_HEIGHT: '/blocks/tip/height',
  GET_FEES_ESTIMATES: '/fee-estimates',
  POST_TRANSACTION: '/tx',
  BATCH_ADDR_BALANCES: '/addresses/batch/info',
  BATCH_ADDR_TRANSACTIONS: '/addresses/batch/txs',
  BATCH_ADDR_UTXOS: '/addresses/batch/utxo',
  BATCH_ADDR_MEMPOOL_TRANSACTIONS: '/addresses/batch/txs/mempool',
}

const REQUEST_TIMEOUT_MS = 15000

const abortControllers = new Set()

const requestElectrum = async (url, body = null, request = fetch) => {
  const method = body ? 'POST' : 'GET'
  const header = body ? { 'Content-Type': 'application/json' } : {}
  const controller = new AbortController()
  abortControllers.add(controller)

  const options = {
    method: method,
    headers: header,
    body,
    // Wire the signal so cancelAllRequests() actually cancels. The timeout
    // releases hung connections so tryServers can advance to the next one.
    signal: AbortSignal.any([
      controller.signal,
      AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ]),
  }

  try {
    const result = await request(url, options)
    if (!result.ok) throw new Error('Request not successful')
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    // Superseded requests (network switch, refresh) abort by design —
    // not an API failure. Callers still receive the throw and decide.
    if (!isAbortError(error)) console.error(error)
    throw error
  } finally {
    abortControllers.delete(controller)
  }
}

const tryServers = async (endpoint, body = null) => {
  const networkType = LocalStorageService.getItem('networkType')

  // No localStorage custom-server override: an unvalidated entry would
  // silently redirect all Bitcoin data (and broadcasts) elsewhere.
  const combinedElectrumServers =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? EnvVars.TESTNET_ELECTRUM_SERVERS
      : EnvVars.MAINNET_ELECTRUM_SERVERS

  for (let i = 0; i < combinedElectrumServers.length; i++) {
    try {
      const response = await requestElectrum(
        combinedElectrumServers[i] + endpoint,
        body,
      )
      return response
    } catch (error) {
      // A cancelled request must not be resurrected against the next server.
      if (isAbortError(error)) throw error
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
  tryServers(
    ELECTRUM_ENDPOINTS.GET_TRANSACTION_DATA.replace(
      ':txid',
      encodeURIComponent(txid),
    ),
  )

const getTransactionHex = (txid) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_TRANSACTION_HEX.replace(
      ':txid',
      encodeURIComponent(txid),
    ),
  )

const getTransactionStatus = (txid) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_TRANSACTION_STATUS.replace(
      ':txid',
      encodeURIComponent(txid),
    ),
  )

const getAddressTransactions = (address) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_TRANSACTIONS.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getAddressMempoolTransactions = (address) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_MEMPOOL_TRANSACTIONS.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getAddress = (address) =>
  tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getAddressUtxo = (address) => {
  return tryServers(
    ELECTRUM_ENDPOINTS.GET_ADDRESS_UTXO.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )
}

const getLastBlockHeight = () =>
  tryServers(ELECTRUM_ENDPOINTS.GET_LAST_BLOCK_HEIGHT)

const checkApiAvailability = async () => {
  try {
    await getLastBlockHeight()
    return true
  } catch {
    return false
  }
}

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

const getAddressBalancesBatch = async (addresses) => {
  const response = await tryServers(
    ELECTRUM_ENDPOINTS.BATCH_ADDR_BALANCES,
    JSON.stringify({ addresses: addresses }),
  )
  const data = JSON.parse(response)
  return data.results
}

const getAddressTransactionsBatch = async (addresses) => {
  const response = await tryServers(
    ELECTRUM_ENDPOINTS.BATCH_ADDR_TRANSACTIONS,
    JSON.stringify({ addresses: addresses }),
  )
  const data = JSON.parse(response)
  return data.results
}

const getAddressMempoolTransactionsBatch = async (addresses) => {
  const response = await tryServers(
    ELECTRUM_ENDPOINTS.BATCH_ADDR_MEMPOOL_TRANSACTIONS,
    JSON.stringify({ addresses: addresses }),
  )
  const data = JSON.parse(response)
  return data.results
}

const getAddressUtxosBatch = async (addresses) => {
  const response = await tryServers(
    ELECTRUM_ENDPOINTS.BATCH_ADDR_UTXOS,
    JSON.stringify({ addresses: addresses }),
  )
  const data = JSON.parse(response)
  return data.results
}

export {
  getLastBlockHash,
  getTransactionData,
  getTransactionStatus,
  getTransactionHex,
  getAddressTransactions,
  getAddressMempoolTransactions,
  getAddress,
  getAddressUtxo,
  requestElectrum,
  getLastBlockHeight,
  getFeesEstimates,
  broadcastTransaction,
  cancelAllRequests,
  getAddressBalancesBatch,
  getAddressTransactionsBatch,
  getAddressMempoolTransactionsBatch,
  getAddressUtxosBatch,
  checkApiAvailability,
  ELECTRUM_ENDPOINTS,
}
