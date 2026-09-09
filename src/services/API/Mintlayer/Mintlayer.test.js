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
