import { EnvVars } from '@Constants'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const prefix = '/api/v1'

const MINTLAYER_ENDPOINTS = {
  GET_ADDRESS_DATA: '/address/:address',
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
    throw error
  }
}

export {
  getAddressData,
  getAddressBalance,
  requestMintlayer,
  MINTLAYER_ENDPOINTS,
}
