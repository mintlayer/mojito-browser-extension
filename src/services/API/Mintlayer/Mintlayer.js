import { EnvVars } from '@Constants'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const prefix = '/api/v2'

const MINTLAYER_ENDPOINTS = {
  GET_ADDRESS_DATA: '/address/:address',
  GET_TRANSACTION_DATA: '/transaction/:txid',
  GET_ADDRESS_UTXO: '/address/:address/all-utxos',
  GET_ADDRESS_SPENDABLE_UTXO: '/address/:address/spendable-utxos',
  POST_TRANSACTION: '/transaction',
  GET_FEES_ESTIMATES: '/feerate',
  GET_ADDRESS_DELEGATIONS: '/address/:address/delegations',
  GET_DELEGATION: '/delegation/:delegation',
  GET_CHAIN_TIP: '/chain/tip',
  GET_BLOCK_HASH: '/chain/:height',
  GET_BLOCK_DATA: '/block/:hash',
  GET_POOL_DATA: '/pool/:hash',
}

const requestMintlayer = async (url, body = null, request = fetch) => {
  const method = body ? 'POST' : 'GET'

  try {
    const result = await request(url, { method, body })
    if (!result.ok) {
      const error = await result.json()
      if (error.error === 'Address not found') {
        return Promise.resolve(
          JSON.stringify({
            unused: true,
            coin_balance: 0,
            transaction_history: [],
          }),
        )
      }

      // handle RPC error
      if (
        error.error.includes(
          'Mempool error: Transaction does not pay sufficient fees to be relayed',
        )
      ) {
        const errorMessage = error.error
          .split('Mempool error: ')[1]
          .split(')')[0]
          .replace('(tx_fee:', '. estimated fee')
          .replace('min_relay_fee:', 'minimum fee')
        throw new Error(errorMessage)
      }

      // handle RPC error
      if (error.error.includes('Mempool error:')) {
        const errorMessage = error.error
          .split('Mempool error: ')[1]
          .split('(')[0]
        throw new Error(errorMessage)
      }

      throw new Error('Request not successful')
    }
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const tryServers = async (endpoint, body = null, forceNetwork) => {
  const networkType = forceNetwork || LocalStorageService.getItem('networkType')
  const customMintlayerServerList = LocalStorageService.getItem(
    AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
  )
  const customMintlayerServer =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? customMintlayerServerList.mintlayer_testnet
      : customMintlayerServerList.mintlayer_mainnet

  const defaultMintlayerServers =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? EnvVars.TESTNET_MINTLAYER_SERVERS
      : EnvVars.MAINNET_MINTLAYER_SERVERS

  const combinedMintlayerServers = customMintlayerServer
    ? [customMintlayerServer, ...defaultMintlayerServers]
    : [...defaultMintlayerServers]
  for (let i = 0; i < combinedMintlayerServers.length; i++) {
    try {
      const response = await requestMintlayer(
        combinedMintlayerServers[i] + prefix + endpoint,
        body,
      )
      return response
    } catch (error) {
      console.warn(
        `${combinedMintlayerServers[i] + prefix + endpoint} request failed: `,
        error,
      )
      if (i === combinedMintlayerServers.length - 1) {
        throw error
      }
    }
  }
}

const getAddressData = (address, network) => {
  const data = tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_DATA.replace(':address', address),
    null,
    network,
  )
  return data
}

const getAddressBalance = async (address) => {
  try {
    const response = await getAddressData(address)
    const data = JSON.parse(response)
    const balance = {
      balanceInAtoms:
        data && data.coin_balance && data.coin_balance.atoms
          ? data.coin_balance.atoms
          : 0,
    }
    const balanceLocked = {
      balanceInAtoms:
        data && data.locked_coin_balance && data.locked_coin_balance.atoms
          ? data.locked_coin_balance.atoms
          : 0,
    }
    return { balance, balanceLocked }
  } catch (error) {
    console.warn(`Failed to get balance for address ${address}: `, error)
    return {
      balance: { balanceInAtoms: 0 },
      balanceLocked: { balanceInAtoms: 0 },
    }
  }
}

export const getWalletBalance = async (addresses) => {
  const balancePromises = addresses.map((address) => getAddressBalance(address))
  const balances = await Promise.all(balancePromises)
  const totalBalance = balances.reduce(
    (acc, curr) => {
      return {
        balanceInAtoms:
          +parseInt(acc.balanceInAtoms) + parseInt(curr.balance.balanceInAtoms),
      }
    },
    { balanceInAtoms: 0 },
  )
  const lockedBalance = balances.reduce(
    (acc, curr) => {
      return {
        balanceInAtoms:
          +parseInt(acc.balanceInAtoms) +
          parseInt(curr.balanceLocked.balanceInAtoms),
      }
    },
    { balanceInAtoms: 0 },
  )
  return { totalBalance, lockedBalance }
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

const getAddressUtxo = (address) =>
  tryServers(MINTLAYER_ENDPOINTS.GET_ADDRESS_UTXO.replace(':address', address))

const getWalletUtxos = (addresses) => {
  const utxosPromises = addresses.map((address) => getAddressUtxo(address))
  return Promise.all(utxosPromises)
}

const getAddressSpendableUtxo = (address) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_SPENDABLE_UTXO.replace(':address', address),
  )

const getWalletSpendableUtxos = (addresses) => {
  const utxosPromises = addresses.map((address) =>
    getAddressSpendableUtxo(address),
  )
  return Promise.all(utxosPromises)
}

const getTokensData = async (tokens) => {
  const tokensData = {}
  tokens.forEach((token) => {
    tokensData[token] = {}
  })
  const tokensPromises = tokens.map((token) => {
    return tryServers(`/token/${token}`)
      .then(JSON.parse)
      .then((data) => {
        tokensData[token] = data
      })
  })
  await Promise.all(tokensPromises)
  return tokensData
}

const getAddressDelegations = (address) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_DELEGATIONS.replace(':address', address),
  )

const getDelegation = (delegation) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_DELEGATION.replace(':delegation', delegation),
  )

const getPool = (pool) =>
  tryServers(MINTLAYER_ENDPOINTS.GET_POOL_DATA.replace(':hash', pool))

const getBlockDataByHeight = (height) => {
  return tryServers(
    MINTLAYER_ENDPOINTS.GET_BLOCK_HASH.replace(':height', height),
  )
    .then(JSON.parse)
    .then((response) => {
      return tryServers(
        MINTLAYER_ENDPOINTS.GET_BLOCK_DATA.replace(':hash', response),
      )
    })
}

const getBlockDataByHash = (hash) => {
  return tryServers(MINTLAYER_ENDPOINTS.GET_BLOCK_DATA.replace(':hash', hash))
}

const getWalletDelegations = (addresses) => {
  const delegationsPromises = addresses.map((address) =>
    getAddressDelegations(address),
  )
  return Promise.all(delegationsPromises).then((results) =>
    results.flatMap(JSON.parse),
  )
}
const getDelegationDetails = (delegations) => {
  const delegationsPromises = delegations.map((delegation) =>
    getDelegation(delegation),
  )
  return Promise.all(delegationsPromises).then((results) =>
    results.flatMap(JSON.parse),
  )
}
const getBlocksData = (heights) => {
  const heightsPromises = heights.map((height) => getBlockDataByHeight(height))
  return Promise.all(heightsPromises).then((results) =>
    results.flatMap(JSON.parse),
  )
}

const getPoolsData = (pools) => {
  const poolsPromises = pools.map((pool) => getPool(pool))
  return Promise.all(poolsPromises).then((results) =>
    results.flatMap(JSON.parse),
  )
}

const getChainTip = async () => {
  return tryServers(MINTLAYER_ENDPOINTS.GET_CHAIN_TIP)
}

const getFeesEstimates = async () => {
  return tryServers(MINTLAYER_ENDPOINTS.GET_FEES_ESTIMATES)
}

const broadcastTransaction = (transaction) =>
  tryServers(MINTLAYER_ENDPOINTS.POST_TRANSACTION, transaction)

export {
  getAddressData,
  getAddressBalance,
  getAddressTransactionIds,
  getWalletTransactionIds,
  getWalletTransactions,
  getTransactionData,
  getAddressTransactions,
  requestMintlayer,
  getAddressUtxo,
  getWalletUtxos,
  getAddressSpendableUtxo,
  getWalletSpendableUtxos,
  getAddressDelegations,
  getWalletDelegations,
  getDelegationDetails,
  getChainTip,
  broadcastTransaction,
  getFeesEstimates,
  getBlocksData,
  getBlockDataByHash,
  getTokensData,
  getPoolsData,
  MINTLAYER_ENDPOINTS,
}
