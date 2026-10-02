import {
  // getAddressData,
  // getAddressBalance,
  // getAddressTransactionIds,
  // getTransactionData,
  // getAddressTransactions,
  requestMintlayer,
} from './Mintlayer.js'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage.js'

import { LocalStorageService } from '@Storage'

if (typeof AbortSignal === 'function' && !AbortSignal.timeout) {
  AbortSignal.timeout = function (ms) {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), ms)
    return controller.signal
  }
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
const mockId = 'networkType'
const mockValue = 'testnet'
LocalStorageService.setItem(mockId, mockValue)

jest.spyOn(console, 'warn').mockImplementation(() => {})
jest.useRealTimers()

test('Mintlayer API request', async () => {
  const consoleErrorSpy = jest
    .spyOn(console, 'error')
    .mockImplementation((err) => {
      expect(err).toBeInstanceOf(Error)
    })

  const fetchAddr = 'testFetch'
  const mockFetch = jest.fn((addr) => {
    return new Promise((resolve) => {
      resolve({
        ok: true,
        text: async () => fetchAddr,
      })
    })
  })

  await expect(requestMintlayer(fetchAddr, null, mockFetch)).resolves.toMatch(
    fetchAddr,
  )

  consoleErrorSpy.mockRestore()
  jest.restoreAllMocks()
})

test('Mintlayer API request - not ok', async () => {
  const fetchAddr = 'testFetch'
  const mockFetch = jest.fn((addr) => {
    return new Promise((resolve, reject) =>
      resolve({
        ok: false,
      }),
    )
  })

  await expect(async () => {
    await requestMintlayer(fetchAddr, null, mockFetch)
  }).rejects.toThrow()
})
// const TESTNET_WALLET = 'tmt1q996a4kpq2ds4snvvgszud6xfhlkcxj7xysjtamj'
// const TX_ID = '7cbfabe0dec48e36e431ba07567e6b54cf74d7cdb7d23e0d673d958ec2b57894'
// const BLOCK_ID =
//   'f35d338feab24baa593997e102c0f11d1808d42ad6971fde5a9dc9754884e0e5'
// const FIRST_BLOCK_ID =
//   'f77e0a23652c01caaeaee29b87939cede82b48f552d029b6d665ed253f75eb2a'
// const FIRST_TX_ID =
//   '59dbe0bc386ad2489f065e68372154216f7286db7385616ab8bb275477f6d0d5'

// TODO: enable tests after TESTNET API moved to v2

// test('getAddressData', async () => {
//   const result = await getAddressData(TESTNET_WALLET)
//   const data = JSON.parse(result)
//   expect(Number(data.coin_balance)).toBeGreaterThan(0)
//   const firstTransactionId =
//     data.transaction_history[data.transaction_history.length - 1]
//   expect(data.transaction_history.length).toBeGreaterThan(0)
//   expect(firstTransactionId).toBe(FIRST_TX_ID)
// })

// test('Mintlayer API request - getTransactionData', async () => {
//   const result = await getTransactionData(TX_ID)
//   expect(result.block_id).toBe(BLOCK_ID)
// })

// test('Mintlayer API request - getAddressTransactionIds', async () => {
//   const result = await getAddressTransactionIds(TESTNET_WALLET)
//   expect(result.length).toBeGreaterThan(0)
//   expect(result[result.length - 1]).toBe(FIRST_TX_ID)
// })

// test('Mintlayer API request - getAdressTransactions', async () => {
//   const result = await getAddressTransactions(TESTNET_WALLET)
//   expect(result.length).toBeGreaterThan(0)
//   expect(result[result.length - 1].block_id).toBe(FIRST_BLOCK_ID)
// })

// test('Mintlayer API request - getAddressBalance', async () => {
//   const result = await getAddressBalance(TESTNET_WALLET)
//   expect(Number(result.balance.balanceInAtoms)).toBeGreaterThan(0)
// })

describe('resolveTokenIcon', () => {
  const { resolveTokenIcon } = require('./Mintlayer.js')

  const okJson = (body) => ({
    ok: true,
    json: async () => body,
  })
  const okImage = () => ({
    ok: true,
    headers: { get: () => 'image/png' },
    blob: async () => ({ size: 1024, type: 'image/png' }),
  })

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-icon')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // fetch mock: bafymetadata* answers the metadata JSON, bafyicon* answers
  // with image bytes
  const mockGateways = ({ metadata, metadataFail = false, iconFail = false }) =>
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('bafyicon')) {
        if (iconFail) throw new Error('signal timed out')
        return okImage()
      }
      if (target.includes('bafymetadata')) {
        if (metadataFail) throw new Error('signal timed out')
        return okJson(metadata)
      }
      throw new Error(`unexpected url ${target}`)
    })

  it('resolves the metadata, fetches the icon bytes and returns a blob url', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/logo.png' },
    })

    const url = await resolveTokenIcon('ipfs://bafymetadata/doc.json')

    expect(url).toBe('blob:mock-icon')
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    // 3 gateways raced for the metadata + 3 for the icon bytes
    expect(
      fetchSpy.mock.calls.filter(([u]) => String(u).includes('bafymetadata')),
    ).toHaveLength(3)
    expect(
      fetchSpy.mock.calls.filter(([u]) => String(u).includes('bafyicon')),
    ).toHaveLength(3)
  })

  it('is fully cached after the first resolution (zero gateway traffic)', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/logo.png' },
    })

    await resolveTokenIcon('ipfs://bafymetadata/cached.json')
    const callsAfterFirst = fetchSpy.mock.calls.length
    await resolveTokenIcon('ipfs://bafymetadata/cached.json')

    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst)
  })

  it('races gateways — a dead one loses the race without blocking', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/i.png' },
    })
    // make the ipfs.io candidate fail for every request
    fetchSpy.mockImplementation(async (url) => {
      const target = String(url)
      if (target.startsWith('https://ipfs.io/')) {
        throw new Error('signal timed out')
      }
      if (target.includes('bafyicon')) return okImage()
      if (target.includes('bafymetadata')) {
        return okJson({ tokenIcon: 'ipfs://bafyicon/i.png' })
      }
      throw new Error(`unexpected url ${target}`)
    })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/slow.json'),
    ).resolves.toBe('blob:mock-icon')

    // invariant: only gateway https urls are requested, never raw ipfs://
    for (const [candidate] of fetchSpy.mock.calls) {
      expect(String(candidate)).toMatch(/^https:\/\//)
      expect(String(candidate)).not.toMatch(/^ipfs:\/\//)
    }
  })

  it('caches a definitive no-icon answer with a TTL', async () => {
    const fetchSpy = mockGateways({ metadata: { name: 'no icon here' } })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon.json'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon.json'),
    ).resolves.toBeUndefined()
    // 3 gateways raced once for the metadata; the negative answer is cached
    expect(fetchSpy.mock.calls.length).toBe(3)
  })

  it('does not cache total gateway failures — the next refresh retries', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('signal timed out'))

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/fail.json'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/fail.json'),
    ).resolves.toBeUndefined()
    // 3 gateway attempts per resolution, nothing cached
    expect(fetchSpy).toHaveBeenCalledTimes(6)
  })

  it('rejects non-ipfs metadata uris without any network request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    await expect(
      resolveTokenIcon('https://evil.example/metadata.json'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('http://localhost:8080/metadata.json'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('abort handling', () => {
  const { getChainTip } = require('./Mintlayer.js')

  // setupTests.js installs a default global fetch mock — restore it after
  // each test so its global beforeEach (fetch.mockClear) keeps working.
  const defaultFetch = global.fetch

  let warnSpy
  let errorSpy

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = defaultFetch
  })

  test('tryServers silences console.warn for aborted requests but still throws', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(
        new DOMException('The operation has been aborted.', 'AbortError'),
      ),
    )

    await expect(getChainTip()).rejects.toThrow()

    // An abort is not a server outage — tryServers must not warn with it.
    const warnedAbortErrors = warnSpy.mock.calls.filter(
      ([, error]) => error?.name === 'AbortError',
    )
    expect(warnedAbortErrors).toHaveLength(0)
  })

  test('tryServers still warns for real failures', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('boom')))

    await expect(getChainTip()).rejects.toThrow('boom')

    expect(warnSpy).toHaveBeenCalled()
    expect(warnSpy.mock.calls[0][0]).toContain('request failed')
  })
})

describe('getAllTokensData / batchRequestMintlayer regression', () => {
  const { getAllTokensData, batchRequestMintlayer } = require('./Mintlayer.js')
  const { EnvVars } = require('@Constants')

  // setupTests.js installs a default global fetch mock — restore it after
  // each test so its global beforeEach (fetch.mockClear) keeps working.
  const defaultFetch = global.fetch

  const originOf = (server) => new URL(server).origin

  let errorSpy
  let warnSpy

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
    global.fetch = defaultFetch
    // leave the suite-wide 'testnet' default in place
    LocalStorageService.setItem('networkType', 'testnet')
  })

  test("getAllTokensData('testnet') requests the proxy ROOT with network=1 and returns the parsed json", async () => {
    expect(EnvVars.TESTNET_MINTLAYER_SERVERS.length).toBeGreaterThan(0)
    const mockedJson = { token1: { symbol: 'T1', decimals: 11 } }
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => mockedJson })

    await expect(getAllTokensData('testnet')).resolves.toEqual(mockedJson)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe(
      `${originOf(EnvVars.TESTNET_MINTLAYER_SERVERS[0])}/batch/dex_tokens?network=1`,
    )
    expect(init.signal).toBeDefined()
  })

  test("getAllTokensData('mainnet') requests the proxy ROOT with network=0", async () => {
    expect(EnvVars.MAINNET_MINTLAYER_SERVERS.length).toBeGreaterThan(0)
    const mockedJson = []
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => mockedJson })

    await expect(getAllTokensData('mainnet')).resolves.toEqual(mockedJson)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(fetchSpy.mock.calls[0][0]).toBe(
      `${originOf(EnvVars.MAINNET_MINTLAYER_SERVERS[0])}/batch/dex_tokens?network=0`,
    )
  })

  test('getAllTokensData rejects with the dedicated error when the response is not ok', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 404 })

    await expect(getAllTokensData('testnet')).rejects.toThrow(
      'Failed to fetch all tokens data',
    )
    expect(errorSpy).toHaveBeenCalled()
  })

  test('getAllTokensData root-origin contract: no /mintlayer/ path segment even when the server path has one', async () => {
    const server = EnvVars.TESTNET_MINTLAYER_SERVERS[0]
    // Precondition: the configured server carries the network-prefixed path
    // (/mintlayer/<network>/) that 404s for dex_tokens — the request must
    // derive the origin instead of reusing that path.
    expect(new URL(server).pathname).toContain('/mintlayer/')

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, json: async () => ({}) })

    await getAllTokensData('testnet')

    const requested = new URL(fetchSpy.mock.calls[0][0])
    expect(requested.pathname).toBe('/batch/dex_tokens')
    expect(requested.pathname).not.toContain('/mintlayer/')
    expect(requested.origin).toBe(originOf(server))
    expect(requested.search).toBe('?network=1')
  })

  test('batchRequestMintlayer keeps URL and body network consistent when networkType is absent or null', async () => {
    const responseText = JSON.stringify({ results: [[{ id: 'r1' }]] })
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: true, text: async () => responseText })

    const ids = ['id1', 'id2']
    const type = 'Transfer'

    // absent networkType
    window.localStorage.removeItem('networkType')
    await expect(batchRequestMintlayer({ ids, type })).resolves.toEqual([
      { id: 'r1' },
    ])

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    const [url, init] = fetchSpy.mock.calls[0]
    // URL: the mainnet server
    expect(url).toBe(`${EnvVars.MAINNET_MINTLAYER_SERVERS[0]}/batch`)
    // body: network selector 0 — must agree with the URL's network
    const body = JSON.parse(init.body)
    expect(body.network).toBe(0)
    expect(body.ids).toEqual(ids)
    expect(body.type).toBe(type)

    // explicit null behaves exactly like absent
    window.localStorage.setItem('networkType', null)
    fetchSpy.mockClear()
    await batchRequestMintlayer({ ids, type })
    const [urlNull, initNull] = fetchSpy.mock.calls[0]
    expect(urlNull).toBe(`${EnvVars.MAINNET_MINTLAYER_SERVERS[0]}/batch`)
    expect(JSON.parse(initNull.body).network).toBe(0)
  })
})

describe('resolveNftImage', () => {
  const { resolveNftImage } = require('./Mintlayer.js')

  const okImage = () => ({
    ok: true,
    headers: { get: () => 'image/png' },
    blob: async () => ({ size: 1024, type: 'image/png' }),
  })

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-nft-image')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('resolves through the explorer proxy first and never touches public gateways', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        if (String(url).includes('/api/ipfs-media/')) return okImage()
        throw new Error(`unexpected url ${url}`)
      })

    const url = await resolveNftImage('ipfs://bafyicon/icon.png', 'testnet')

    expect(url).toBe('blob:mock-nft-image')
    const [proxyUrl] = fetchSpy.mock.calls[0]
    expect(proxyUrl).toBe(
      'https://lovelace.explorer.mintlayer.org/api/ipfs-media/bafyicon/icon.png',
    )
  })

  it('falls back to the public gateway race when the proxy fails', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        if (String(url).includes('/api/ipfs-media/')) {
          return { ok: false, status: 404 }
        }
        // gateway race candidates answer with image bytes
        return okImage()
      })

    const url = await resolveNftImage('ipfs://bafyfallback/pic.jpg', 'mainnet')

    expect(url).toBe('blob:mock-nft-image')
    // the proxy + the 3 raced public gateways
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })

  it('returns null for non-ipfs uris without fetching anything', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    await expect(
      resolveNftImage('https://evil.example/image.png', 'mainnet'),
    ).resolves.toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('caches results — the second call does not refetch', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => okImage())

    const uri = 'ipfs://bafycached/cover.png'
    await resolveNftImage(uri, 'mainnet')
    await resolveNftImage(uri, 'mainnet')

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
