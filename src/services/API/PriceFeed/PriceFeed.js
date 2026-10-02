import { EnvVars } from '@Constants'

const PRICE_FEED_URL = EnvVars.PRICE_FEED_SERVER

if (!PRICE_FEED_URL && process.env.NODE_ENV !== 'production') {
  throw new Error('PRICE_FEED_SERVER is not configured')
}

/**
 * On-chain token ticker -> price feed ticker (price-feed-api.mintlayer.org,
 * see mojito-api src/prices/ticker-map.ts for the covered set).
 *
 * Built on a null prototype so an on-chain ticker like 'constructor' or
 * '__proto__' resolves to undefined instead of an inherited Object property.
 *
 * Keys mirror the on-chain `token_info.token_ticker.string` values, which
 * match the bridge token metadata (bridge_v2/deploy/tokens/metadata/).
 * Tokens absent from this map (e.g. mlUSDS, mlXAUt) have no feed coverage
 * and resolve to no price.
 *
 * Option B (future cleanup): make mojito-api's ticker-map accept the
 * on-chain ticker names directly (add mlUSDT-style aliases to
 * PRICE_ID_BY_TICKER). This map can then be deleted and getPrices() called
 * with the on-chain ticker as-is.
 */
const ONCHAIN_TICKER_TO_FEED_TICKER = Object.assign(Object.create(null), {
  mlUSDC: 'usdc',
  mlUSDT: 'usdt',
  mlDAI: 'dai',
  mlWETH: 'weth',
  mlWBTC: 'wbtc',
  mlwstETH: 'wsteth',
  mlPEPE: 'pepe',
  mlSHIB: 'shib',
  mlAAVE: 'aave',
  mlCOMP: 'comp',
  mlCRV: 'crv',
  mlLDO: 'ldo',
  mlLINK: 'link',
  mlONDO: 'ondo',
  mlUNI: 'uni',
  wAAPLx: 'waaplx',
  wAMDx: 'wamdx',
  wAMZNx: 'wamznx',
  wAVGOx: 'wavgox',
  wDISx: 'wdisx',
  wGLDx: 'wgldx',
  wGOOGLx: 'wgooglx',
  wIWMx: 'wiwmx',
  wJPMx: 'wjpmx',
  wKOx: 'wkox',
  wLLYx: 'wllyx',
  wMCDx: 'wmcdx',
  wMETAx: 'wmetax',
  wMSFTx: 'wmsftx',
  wNFLXx: 'wnflxx',
  wNVDAx: 'wnvdax',
  wQQQx: 'wqqqx',
  wSPYx: 'wspyx',
  wTSLAx: 'wtslax',
  wXOMx: 'wxomx',
})

/**
 * Resolves an on-chain token ticker to its price feed ticker, or undefined
 * when the token is not covered by the feed.
 */
const toFeedTicker = (onchainTicker) =>
  ONCHAIN_TICKER_TO_FEED_TICKER[onchainTicker]

/**
 * USD prices for the bridge asset set, keyed by feed ticker.
 * Pass a list of feed tickers to filter; omit to get the full covered set.
 *
 * Stale-on-error semantics live server-side; a non-ok response or missing
 * rate simply throws, and consumers keep their previous snapshot.
 */
const getPrices = async (tickers, request = fetch) => {
  const query = tickers?.length
    ? `?tickers=${encodeURIComponent(tickers.join(','))}`
    : ''
  const result = await request(`${PRICE_FEED_URL}/prices${query}`)
  if (!result.ok)
    throw new Error(`Price feed request failed (${result.status})`)
  const prices = await result.json()
  if (prices == null || typeof prices !== 'object') {
    throw new Error('Price feed returned an unusable rate')
  }
  for (const price of Object.values(prices)) {
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
      throw new Error('Price feed returned an unusable rate')
    }
  }
  return prices
}

export { getPrices, toFeedTicker, ONCHAIN_TICKER_TO_FEED_TICKER }
