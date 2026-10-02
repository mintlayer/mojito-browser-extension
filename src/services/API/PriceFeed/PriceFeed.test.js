import {
  getPrices,
  toFeedTicker,
  ONCHAIN_TICKER_TO_FEED_TICKER,
} from './PriceFeed'

describe('getPrices', () => {
  afterEach(() => {
    // Drop the test-specific fetch mock. A neutral stub is reinstated
    // afterwards because the global beforeEach in setupTests.js touches
    // global.fetch and would otherwise crash on the deleted value.
    delete global.fetch
    global.fetch = jest.fn()
  })

  test('fetches the full price set from the price feed server', async () => {
    const prices = { ml: 0.005, usdc: 1 }

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(prices),
      }),
    )

    const response = await getPrices()

    expect(response).toEqual(prices)
    expect(fetch).toHaveBeenCalledWith(
      'https://price-feed-api.mintlayer.org/prices',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  test('fetches only the requested tickers when a list is passed', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ usdt: 1 }),
      }),
    )

    const response = await getPrices(['usdt'])

    expect(response).toEqual({ usdt: 1 })
    expect(fetch).toHaveBeenCalledWith(
      'https://price-feed-api.mintlayer.org/prices?tickers=usdt',
    )
  })

  test('URL-encodes the joined ticker list for multiple tickers', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ usdt: 1, usdc: 1 }),
      }),
    )

    const response = await getPrices(['usdt', 'usdc'])

    expect(response).toEqual({ usdt: 1, usdc: 1 })
    expect(fetch).toHaveBeenCalledWith(
      'https://price-feed-api.mintlayer.org/prices?tickers=usdt%2Cusdc',
    )
  })

  test('fetches the bare URL without a query string for an empty ticker list', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    )

    const response = await getPrices([])

    expect(response).toEqual({})
    expect(fetch).toHaveBeenCalledWith(
      'https://price-feed-api.mintlayer.org/prices',
    )
  })

  test('throws when the price feed response is not ok', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      }),
    )

    await expect(getPrices()).rejects.toThrow('Price feed request failed')
  })

  test('throws when the response contains an unusable rate', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ml: 0, usdc: '1' }),
      }),
    )

    await expect(getPrices()).rejects.toThrow('unusable rate')
  })

  test('throws when the response body is null', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      }),
    )

    await expect(getPrices()).rejects.toThrow(/unusable rate/)
  })
})

describe('toFeedTicker', () => {
  test('maps covered on-chain tickers to their feed tickers', () => {
    expect(toFeedTicker('mlUSDT')).toBe('usdt')
    expect(toFeedTicker('mlUSDC')).toBe('usdc')
    expect(toFeedTicker('mlwstETH')).toBe('wsteth')
    expect(toFeedTicker('mlWBTC')).toBe('wbtc')
    expect(toFeedTicker('wAAPLx')).toBe('waaplx')
    expect(toFeedTicker('wTSLAx')).toBe('wtslax')
  })

  test('returns undefined for tickers without feed coverage', () => {
    expect(toFeedTicker('mlUSDS')).toBeUndefined()
    expect(toFeedTicker('mlXAUt')).toBeUndefined()
    expect(toFeedTicker('SOMETHINGELSE')).toBeUndefined()
  })

  test('returns undefined for Object.prototype property names', () => {
    expect(toFeedTicker('constructor')).toBeUndefined()
    expect(toFeedTicker('__proto__')).toBeUndefined()
    expect(toFeedTicker('toString')).toBeUndefined()
    expect(toFeedTicker('hasOwnProperty')).toBeUndefined()
  })
})

describe('ONCHAIN_TICKER_TO_FEED_TICKER', () => {
  test('contains the full on-chain to feed ticker map', () => {
    expect(ONCHAIN_TICKER_TO_FEED_TICKER).toEqual({
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
  })
})
