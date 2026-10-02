import { EnvVars } from '@Constants'
import { isAbortError } from 'src/utils/Helpers/AbortError/AbortError'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const MINTLAYER_ENDPOINTS = {
  GET_ADDRESS_DATA: '/address/:address',
  GET_TRANSACTION_DATA: '/transaction/:txid',
  GET_ADDRESS_UTXO: '/address/:address/all-utxos',
  GET_ADDRESS_SPENDABLE_UTXO: '/address/:address/spendable-utxos',
  POST_TRANSACTION: '/transaction',
  GET_FEES_ESTIMATES: '/feerate',
  GET_ADDRESS_DELEGATIONS: '/address/:address/delegations',
  GET_DELEGATION: '/delegation/:address',
  GET_CHAIN_TIP: '/chain/tip',
  GET_BLOCK_HASH: '/chain/:address',
  GET_BLOCK_DATA: '/block/:address',
  GET_POOL_DATA: '/pool/:address',
  GET_NFT: '/nft/:tokenId',
  GET_ORDER_DATA: '/order/:hash',
  GET_TOKEN: '/token/:tokenId',
  GET_ORDERS_PAIR: '/order/pair/:pair',
  POST_BATCH: '/batch',
  GET_BATCH_DEX_TOKENS: '/batch/dex_tokens',
}

const REQUEST_TIMEOUT_MS = 15000

const abortControllers = new Set()

// Server fallback chain for the active network. Deliberately does NOT honor
// any localStorage 'customAPIServers' override: an unvalidated entry would
// silently redirect every request — including transaction broadcasts — to an
// arbitrary endpoint serving spoofed UTXOs/fees.
const getMintlayerServers = (networkType) =>
  networkType === AppInfo.NETWORK_TYPES.TESTNET
    ? EnvVars.TESTNET_MINTLAYER_SERVERS
    : EnvVars.MAINNET_MINTLAYER_SERVERS

const requestMintlayer = async (
  url,
  body = null,
  request = fetch,
  headers = {},
) => {
  const method = body ? 'POST' : 'GET'
  const controller = new AbortController()
  abortControllers.add(controller)

  try {
    const result = await request(url, {
      method,
      body,
      headers,
      // Wire the signal: without it cancelAllRequests() aborts nothing and
      // stale responses land after a network switch. The timeout releases
      // hung connections so tryServers can advance to the next server.
      signal: AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ]),
    })
    if (!result.ok) {
      // The error body is not guaranteed to be JSON with a string `error`
      // field (502 HTML pages, etc.) — never let the parser mask the HTTP
      // failure.
      let errorBody = null
      try {
        errorBody = await result.json()
      } catch {
        errorBody = null
      }
      const message =
        typeof errorBody?.error === 'string' ? errorBody.error : ''

      if (message === 'Address not found') {
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
        message.includes(
          'Mempool error: Transaction does not pay sufficient fees to be relayed',
        )
      ) {
        const errorMessage = message
          .split('Mempool error: ')[1]
          .split(')')[0]
          .replace('(tx_fee:', '. estimated fee')
          .replace('min_relay_fee:', 'minimum fee')
        throw new Error(errorMessage)
      }

      // handle RPC error
      if (message.includes('Mempool error:')) {
        const errorMessage = message.split('Mempool error: ')[1].split('(')[0]
        throw new Error(errorMessage)
      }

      throw new Error('Request not successful')
    }
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

export const batchRequestMintlayer = async ({ ids, type }) => {
  if (!ids || !ids.length) {
    return [] // if no ids provided, return empty array
  }

  // Same normalization as tryServers: a missing/unparsable networkType must
  // resolve identically for the URL path AND the batch body's network
  // selector, otherwise the request is split across two networks.
  const networkType =
    LocalStorageService.getItem('networkType') || AppInfo.NETWORK_TYPES.MAINNET

  const response = await tryServers(
    MINTLAYER_ENDPOINTS.POST_BATCH,
    JSON.stringify({
      ids,
      type,
      network: networkType === AppInfo.NETWORK_TYPES.MAINNET ? 0 : 1,
    }),
    null,
    { 'Content-Type': 'application/json' },
  )

  const json = JSON.parse(response)
  const results = (json.results ?? []).flat()
  return results
}

const tryServers = async (
  endpoint,
  body = null,
  forceNetwork,
  headers = {},
) => {
  // Explicit mainnet default (matches NetworkTypeEntity.get()): a missing or
  // unparsable stored value must not silently differ between call sites.
  const networkType =
    forceNetwork ||
    LocalStorageService.getItem('networkType') ||
    AppInfo.NETWORK_TYPES.MAINNET
  const combinedMintlayerServers = getMintlayerServers(networkType)

  for (let i = 0; i < combinedMintlayerServers.length; i++) {
    try {
      const response = await requestMintlayer(
        combinedMintlayerServers[i] + endpoint,
        body,
        fetch,
        headers,
      )
      return response
    } catch (error) {
      // A cancelled request must not be resurrected against the next server.
      if (isAbortError(error)) throw error
      console.warn(
        `${combinedMintlayerServers[i] + endpoint} request failed: `,
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
    MINTLAYER_ENDPOINTS.GET_ADDRESS_DATA.replace(
      ':address',
      encodeURIComponent(address),
    ),
    null,
    network,
  )
  return data
}

// Failures are rethrown: an offline wallet must surface fetchError in the
// provider instead of rendering a 0.00 balance that reads as "funds gone".
const getAddressBalance = async (address) => {
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
}

// Sums atom strings with BigInt math: values above 2^53 keep their
// precision and non-numeric atom strings cannot poison the total.
const sumAtomStrings = (values) =>
  values.reduce((total, value) => {
    const atoms = String(value ?? '').trim()
    return /^-?\d+$/.test(atoms) ? total + BigInt(atoms) : total
  }, 0n)

export const getWalletBalance = async (addresses) => {
  const balancePromises = addresses.map((address) => getAddressBalance(address))
  const balances = await Promise.all(balancePromises)
  const totalBalance = {
    balanceInAtoms: Number(
      sumAtomStrings(balances.map((entry) => entry.balance.balanceInAtoms)),
    ),
  }
  const lockedBalance = {
    balanceInAtoms: Number(
      sumAtomStrings(
        balances.map((entry) => entry.balanceLocked.balanceInAtoms),
      ),
    ),
  }
  return { totalBalance, lockedBalance }
}

const getAddressTransactionIds = async (address) => {
  const response = await getAddressData(address)
  const data = JSON.parse(response)
  return data.transaction_history
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
      MINTLAYER_ENDPOINTS.GET_TRANSACTION_DATA.replace(
        ':txid',
        encodeURIComponent(txid),
      ),
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
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_UTXO.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getWalletUtxos = (addresses) => {
  const utxosPromises = addresses.map((address) => getAddressUtxo(address))
  return Promise.all(utxosPromises)
}

const getAddressSpendableUtxo = (address) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_SPENDABLE_UTXO.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getWalletSpendableUtxos = (addresses) => {
  const utxosPromises = addresses.map((address) =>
    getAddressSpendableUtxo(address),
  )
  return Promise.all(utxosPromises)
}

const getTokenById = async (tokenId) => {
  try {
    const response = await tryServers(
      MINTLAYER_ENDPOINTS.GET_TOKEN.replace(
        ':tokenId',
        encodeURIComponent(tokenId),
      ),
    )
    return JSON.parse(response)
  } catch (error) {
    console.error(`Failed to fetch data for token ${tokenId}:`, error)
    throw error
  }
}

const getTokensData = async (tokens) => {
  const tokensData = {}
  tokens.forEach((token) => {
    tokensData[token] = {}
  })

  const tokensPromises = tokens.map(async (token) => {
    try {
      const text = await tryServers(`/token/${encodeURIComponent(token)}`)
      const data = await JSON.parse(text)
      tokensData[token] = data
    } catch (error) {
      console.error(`Failed to fetch data for token ${token}:`, error)
    }
  })

  await Promise.allSettled(tokensPromises)
  return tokensData
}

const getNftsData = async (tokens) => {
  const tokensData = {}
  const excludedTokenIds = {} // to send tokens that had zero decimal and 1/1 atoms/decimals value (which is looks like NFT)
  tokens.forEach((token) => {
    tokensData[token] = {}
  })

  const tokensPromises = tokens.map(async (token) => {
    try {
      const text = await tryServers(`/nft/${encodeURIComponent(token)}`)
      const data = await JSON.parse(text)
      tokensData[token] = data
    } catch (error) {
      if (error.message.includes('Request not successful')) {
        excludedTokenIds[token] = 1
      }
      console.error(`Failed to fetch data for token ${token}:`, error)
    }
  })

  await Promise.allSettled(tokensPromises)
  return { tokensData, excludedTokenIds }
}

// Mintlayer tokens carry no on-chain icon: the token points at a metadata
// document (metadata_uri, usually ipfs://) whose JSON holds the icon under
// `tokenIcon` (also tolerate `icon_uri`/`icon`). The icon itself is often an
// ipfs:// uri again.
// The raw ipfs:// scheme is never fetched or rendered: every uri is mapped
// to one of these gateways. Public gateway availability varies per network
// and providers have multi-hour outages (2026-09-09: ipfs.io hung,
// dweb.link answered 429 with its service-worker-only migration notice,
// w3s.link 301'd straight into dweb.link), so the list is ordered
// verified-working first and all of them are RACED in parallel — the first
// usable JSON wins and a dead gateway loses the race without adding serial
// latency.
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://4everland.io/ipfs',
  'https://ipfs.io/ipfs',
]
// Token metadata is issuer-controlled: only ipfs:// metadata documents are
// resolved (through the fixed gateway list) and only gateway-hosted icons
// are returned. Arbitrary https/http metadata or icon urls would turn token
// issuance into a request-forgery/tracking vector from the wallet UI.
const isAllowedIpfsUri = (uri) =>
  typeof uri === 'string' && uri.startsWith('ipfs://')

const NEGATIVE_CACHE_TTL_MS = 5 * 60 * 1000
const ICON_MAX_BYTES = 5 * 1024 * 1024
// metadata uri -> { value: blobUrl, expires? } (negative entries carry a TTL)
const tokenIconCache = new Map()
// metadata uri -> parsed JSON. Ipfs content is content-addressed, so a
// resolved metadata document never needs to be fetched again.
const metadataCache = new Map()
const failedLookupsLogged = new Set()

const fetchJsonWithGatewayFallback = async (metadataUri) => {
  const candidates = IPFS_GATEWAYS.map(
    (gateway) => `${gateway}/${metadataUri.slice('ipfs://'.length)}`,
  )

  const attempts = candidates.map(async (candidate) => {
    // Timeout: this runs inside the wallet data refresh and gateways can
    // hang — never block the whole refresh on an icon.
    const response = await fetch(candidate, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    return response.json()
  })

  try {
    return await Promise.any(attempts)
  } catch {
    return null
  }
}

// Races the gateways for the icon BYTES and returns an in-memory object
// URL. Once fetched, the icon never touches a gateway again — it renders
// from the blob, so the periodic refresh stops hammering public gateways
// (they rate-limit aggressively).
const fetchIconBlobUrl = async (iconUri) => {
  const candidates = iconUri.startsWith('ipfs://')
    ? IPFS_GATEWAYS.map(
        (gateway) => `${gateway}/${iconUri.slice('ipfs://'.length)}`,
      )
    : [iconUri]

  const attempts = candidates.map(async (candidate) => {
    const response = await fetch(candidate, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const type = response.headers?.get?.('content-type') || ''
    if (type && !type.startsWith('image/')) {
      throw new Error(`Not an image: ${type}`)
    }
    const blob = await response.blob()
    if (blob.size > ICON_MAX_BYTES) {
      throw new Error('Icon too large')
    }
    return URL.createObjectURL(blob)
  })

  try {
    return await Promise.any(attempts)
  } catch {
    return null
  }
}

const resolveTokenIcon = async (metadataUri) => {
  if (!isAllowedIpfsUri(metadataUri)) return undefined

  const cached = tokenIconCache.get(metadataUri)
  if (cached) {
    // Negative entries carry a TTL; positive results are permanent.
    if (cached.expires && cached.expires < Date.now()) {
      tokenIconCache.delete(metadataUri)
    } else {
      return cached.value ?? undefined
    }
  }

  const metadata =
    metadataCache.get(metadataUri) ??
    (await fetchJsonWithGatewayFallback(metadataUri))
  if (metadata) {
    // Ipfs content is content-addressed: cache the document permanently so
    // the refresh loop never re-fetches it.
    metadataCache.set(metadataUri, metadata)
  } else {
    // Every gateway failed: log once per uri, do NOT cache — the next
    // refresh retries.
    if (!failedLookupsLogged.has(metadataUri)) {
      failedLookupsLogged.add(metadataUri)
      console.error(
        `Failed to resolve token metadata from every gateway: ${metadataUri}`,
      )
    }
    return undefined
  }

  const raw = metadata.tokenIcon || metadata.icon_uri || metadata.icon
  // Scheme allowlist: ipfs:// resolves through the gateway race, https://
  // is fetched directly. http:// (cleartext/internal-network) and exotic
  // schemes are rejected — token metadata is issuer-controlled.
  if (!(raw && typeof raw === 'string' && /^(ipfs|https):\/\//.test(raw))) {
    // Definitive "document has no icon": cache with a TTL so the gateways
    // are not hammered on every refresh.
    tokenIconCache.set(metadataUri, {
      value: null,
      expires: Date.now() + NEGATIVE_CACHE_TTL_MS,
    })
    return undefined
  }

  const blobUrl = await fetchIconBlobUrl(raw)
  if (blobUrl) {
    tokenIconCache.set(metadataUri, { value: blobUrl })
    return blobUrl
  }

  // Icon bytes unreachable right now: not cached, retried next refresh.
  return undefined
}

// ── NFT media ─────────────────────────────────────────────────────────────
// NFT icon_uri/media_uri point at ipfs:// content. Images resolve through
// the explorer's first-party proxy first (GET /api/ipfs-media/{cid}: the
// explorer does the fetching, so gateway hosts never see the user's IP;
// responses are PNG/JPEG/WebP ≤1MB, immutably cached), falling back to the
// public gateway race the token icons use. Only ipfs:// uris are resolved —
// issuer-controlled https urls stay a request-forgery vector.
const EXPLORER_IPFS_PROXY_HOSTS = {
  [AppInfo.NETWORK_TYPES.MAINNET]: 'https://explorer.mintlayer.org',
  [AppInfo.NETWORK_TYPES.TESTNET]: 'https://lovelace.explorer.mintlayer.org',
}

// Same shape the explorer proxy allow-lists (CID + optional filename, no
// '..'): reject anything else instead of building a junk url.
const isSafeCidPath = (path) =>
  path.length <= 256 &&
  /^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/.test(path)

const explorerIpfsMediaUrl = (ipfsUri, networkType) => {
  if (!isAllowedIpfsUri(ipfsUri)) return null
  const cidPath = ipfsUri.slice('ipfs://'.length)
  if (!isSafeCidPath(cidPath)) return null
  const host =
    EXPLORER_IPFS_PROXY_HOSTS[networkType] ||
    EXPLORER_IPFS_PROXY_HOSTS[AppInfo.NETWORK_TYPES.MAINNET]
  return `${host}/api/ipfs-media/${cidPath}`
}

// uri+network -> { value: blobUrl | null, expires? } (negative entries TTL)
const nftImageCache = new Map()

const resolveNftImage = async (ipfsUri, networkType) => {
  if (!isAllowedIpfsUri(ipfsUri)) return null

  const cacheKey = `${networkType || AppInfo.NETWORK_TYPES.MAINNET}|${ipfsUri}`
  const cached = nftImageCache.get(cacheKey)
  if (cached) {
    if (cached.value === null && cached.expires < Date.now()) {
      nftImageCache.delete(cacheKey)
    } else {
      return cached.value
    }
  }

  const proxyUrl = explorerIpfsMediaUrl(ipfsUri, networkType)
  const viaProxy = proxyUrl
    ? fetch(proxyUrl, { signal: AbortSignal.timeout(10000) }).then(
        async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const type = (response.headers?.get?.('content-type') || '')
            .split(';')[0]
            .trim()
          if (type && !type.startsWith('image/')) {
            throw new Error(`Not an image: ${type}`)
          }
          const blob = await response.blob()
          if (blob.size > ICON_MAX_BYTES) throw new Error('Image too large')
          return URL.createObjectURL(blob)
        },
      )
    : Promise.reject(new Error('no proxy url'))

  const blobUrl = await viaProxy.catch(() => fetchIconBlobUrl(ipfsUri))

  if (blobUrl) {
    // Content-addressed: a resolved image never needs fetching again.
    nftImageCache.set(cacheKey, { value: blobUrl })
  } else {
    // Unreachable right now: negative-cache with a TTL so grid renders
    // don't hammer the proxy on every refresh; retried after it expires.
    nftImageCache.set(cacheKey, {
      value: null,
      expires: Date.now() + NEGATIVE_CACHE_TTL_MS,
    })
  }
  return blobUrl
}

const getAddressDelegations = (address) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ADDRESS_DELEGATIONS.replace(
      ':address',
      encodeURIComponent(address),
    ),
  )

const getDelegation = (delegation) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_DELEGATION.replace(
      ':address',
      encodeURIComponent(delegation),
    ),
  )

const getPool = (pool) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_POOL_DATA.replace(
      ':address',
      encodeURIComponent(pool),
    ),
  )

const getBlockDataByHeight = (height) => {
  return tryServers(
    MINTLAYER_ENDPOINTS.GET_BLOCK_HASH.replace(
      ':address',
      encodeURIComponent(height),
    ),
  )
    .then(JSON.parse)
    .then((response) => {
      return tryServers(
        MINTLAYER_ENDPOINTS.GET_BLOCK_DATA.replace(
          ':address',
          encodeURIComponent(response),
        ),
      )
    })
}

const getBlockDataByHash = (hash) => {
  return tryServers(
    MINTLAYER_ENDPOINTS.GET_BLOCK_DATA.replace(
      ':address',
      encodeURIComponent(hash),
    ),
  )
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

const getOrderById = (orderHash) =>
  tryServers(
    MINTLAYER_ENDPOINTS.GET_ORDER_DATA.replace(
      ':hash',
      encodeURIComponent(orderHash),
    ),
  )

const broadcastTransaction = (transaction) =>
  tryServers(MINTLAYER_ENDPOINTS.POST_TRANSACTION, transaction)

const cancelAllRequests = () => {
  abortControllers.forEach((controller) => controller.abort())
  abortControllers.clear()
}

const getAllTokensData = async (networkType) => {
  try {
    const network = networkType === AppInfo.NETWORK_TYPES.MAINNET ? 0 : 1
    // The dex_tokens route lives at the proxy ROOT with a `network` query
    // selector (network=0 mainnet / 1 testnet) — it is NOT served under
    // /mintlayer/<network>/ (404), so derive the origin from the configured
    // server instead of reusing its network-prefixed path.
    const server = getMintlayerServers(networkType)[0]
    const root = new URL(server).origin
    const response = await fetch(
      `${root}${MINTLAYER_ENDPOINTS.GET_BATCH_DEX_TOKENS}?network=${network}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    )
    if (!response.ok) {
      throw new Error('Failed to fetch all tokens data')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in getAllTokensData:', error)
    throw error
  }
}

const getOrdersListByPair = async (pair) => {
  try {
    const response = await tryServers(
      MINTLAYER_ENDPOINTS.GET_ORDERS_PAIR.replace(
        ':pair',
        encodeURIComponent(pair),
      ),
    )
    return JSON.parse(response)
  } catch (error) {
    console.error(`Failed to fetch orders for pair ${pair}:`, error)
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
  getTokenById,
  getTokensData,
  resolveTokenIcon,
  explorerIpfsMediaUrl,
  resolveNftImage,
  getPoolsData,
  getNftsData,
  getOrderById,
  MINTLAYER_ENDPOINTS,
  abortControllers,
  cancelAllRequests,
  getAllTokensData,
  getOrdersListByPair,
}
