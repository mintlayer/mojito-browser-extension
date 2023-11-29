import { EnvVars } from '@Constants'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const prefix = '/api/v1'

const MINTLAYER_ENDPOINTS = {
  GET_ADDRESS_DATA: '/address/:address',
  GET_TRANSACTION_DATA: '/transaction/:txid',
}

const requestMintlayer = async (url, body = null, request = fetch) => {
  const method = body ? 'POST' : 'GET'

  try {
    const result = await request(url, { method, body })
    if (!result.ok) throw new Error('Request not successful')
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const tryServers = async (endpoint, body = null) => {
  const networkType = LocalStorageService.getItem('networkType')
  const mintlayerServers =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? EnvVars.TESTNET_MINTLAYER_SERVERS
      : EnvVars.MAINNET_MINTLAYER_SERVERS
  for (let i = 0; i < mintlayerServers.length; i++) {
    try {
      const response = await requestMintlayer(
        mintlayerServers[i] + prefix + endpoint,
        body,
      )
      return response
    } catch (error) {
      console.warn(
        `${mintlayerServers[i] + prefix + endpoint} request failed: `,
        error,
      )
      if (i === mintlayerServers.length - 1) {
        throw error
      }
    }
  }
}

const getAddressData = (address) => {
  const data = tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_DATA.replace(':address', address),
  )
  return data
}

const getAddressBalance = async (address) => {
  try {
    const response = await getAddressData(address)
    const data = JSON.parse(response)
    const balanceInCoins = data.coin_balance / AppInfo.ML_ATOMS_PER_COIN
    const balance = {
      balanceInAtoms: data.coin_balance,
      balanceInCoins: balanceInCoins,
    }
    return balance
  } catch (error) {
    console.warn(`Failed to get balance for address ${address}: `, error)
    return { balanceInAtoms: 0, balanceInCoins: 0 }
  }
}

export const getWalletBalance = async (addresses) => {
  const receivingBalancePromises = addresses.map((address) =>
    getAddressBalance(address),
  )
  const receivingBalances = await Promise.all(receivingBalancePromises)
  const totalBalance = receivingBalances.reduce(
    (acc, curr) => {
      return {
        balanceInAtoms: acc.balanceInAtoms + curr.balanceInAtoms,
        balanceInCoins: acc.balanceInCoins + curr.balanceInCoins,
      }
    },
    { balanceInAtoms: 0, balanceInCoins: 0 },
  )
  return totalBalance
}

const getAddressTransactionIds = async (address) => {
  try {
    const response = await getAddressData(address)
    const data = JSON.parse(response)
    return data.transaction_history
  } catch (error) {
    console.warn(`Failed to get balance for address ${address}: `, error)
    return []
  }
}

const getWalletTransactionIds = async (addresses) => {
  const receivingTransactionsPromises = addresses.map((address) =>
    getAddressTransactionIds(address),
  )
  const receivingTransactions = await Promise.all(receivingTransactionsPromises)
  return receivingTransactions.flat()
}

const getWalletTransactions = async (addresses) => {
  const txids = await getWalletTransactionIds(addresses)
  const transactionsPromises = txids.map((txid) => getTransactionData(txid))
  const transactionsData = await Promise.all(transactionsPromises)
  return transactionsData
}

const getTransactionData = async (txid) => {
  try {
    const responce = await tryServers(
      MINTLAYER_ENDPOINTS.GET_TRANSACTION_DATA.replace(':txid', txid),
    )
    const data = JSON.parse(responce)
    return { txid, ...data }
  } catch (error) {
    console.warn(`Failed to get data for transaction ${txid}: `, error)
    throw error
  }
}

const getAddressTransactions = async (address) => {
  try {
    const txids = await getAddressTransactionIds(address)
    const transactionsPromises = txids.map((txid) => getTransactionData(txid))
    const transactionsData = await Promise.all(transactionsPromises)
    return transactionsData
  } catch (error) {
    console.error('Failed to get data for transactions: ', error)
    throw error
  }
}

export {
  getAddressData,
  getAddressBalance,
  getAddressTransactionIds,
  getWalletTransactionIds,
  getWalletTransactions,
  getTransactionData,
  getAddressTransactions,
  requestMintlayer,
  MINTLAYER_ENDPOINTS,
}
