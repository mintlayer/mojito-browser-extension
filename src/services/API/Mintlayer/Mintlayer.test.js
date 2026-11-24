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

// The metadata streaming guard decodes chunk bytes with TextDecoder;
// jsdom does not provide it — Node's implementation is identical to the
// browsers'. Same conditional-polyfill pattern as AbortSignal.timeout.
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
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
    // the metadata gateway legs buffer response.text() (the size cap is
    // applied before JSON.parse); json() stays for other read paths
    text: async () => JSON.stringify(body),
    json: async () => body,
  })
  const okImage = () => ({
    ok: true,
    headers: { get: () => 'image/png' },
    blob: async () => ({ size: 1024, type: 'image/png' }),
  })
  const MAINNET_PROXY_ICON = 'https://explorer.mintlayer.org/api/ipfs-media/'

  beforeAll(() => {
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-icon')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // fetch mock: the gateways answer the metadata JSON for bafymetadata*;
  // the explorer proxy AND the gateway race answer image bytes for bafyicon*
  const mockGateways = ({
    metadata,
    metadataFail = false,
    iconFail = false,
    proxyFail = false,
  }) =>
    jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
      const target = String(url)
      if (target.includes('/api/ipfs-media/')) {
        if (proxyFail) return { ok: false, status: 404 }
        if (target.includes('bafyicon')) return okImage()
      }
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

  const iconCallsOf = (fetchSpy) =>
    fetchSpy.mock.calls.filter(([u]) => String(u).includes('bafyicon'))

  it('resolves the icon through the first-party explorer proxy — gateways untouched on success', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/logo.png' },
    })

    const url = await resolveTokenIcon(
      'ipfs://bafymetadata/doc.json',
      'mainnet',
    )

    expect(url).toBe('blob:mock-icon')
    expect(global.URL.createObjectURL).toHaveBeenCalled()
    // 3 gateways raced for the metadata JSON…
    expect(
      fetchSpy.mock.calls.filter(([u]) => String(u).includes('bafymetadata')),
    ).toHaveLength(3)
    // …but the icon bytes come from exactly ONE first-party proxy request
    const iconCalls = iconCallsOf(fetchSpy)
    expect(iconCalls).toHaveLength(1)
    expect(String(iconCalls[0][0])).toBe(
      `${MAINNET_PROXY_ICON}bafyicon/logo.png`,
    )
  })

  it('is fully cached after the first resolution (zero gateway traffic)', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/logo.png' },
    })

    await resolveTokenIcon('ipfs://bafymetadata/cached.json', 'mainnet')
    const callsAfterFirst = fetchSpy.mock.calls.length
    await resolveTokenIcon('ipfs://bafymetadata/cached.json', 'mainnet')

    expect(fetchSpy.mock.calls.length).toBe(callsAfterFirst)
  })

  it('falls back to the public gateway race when the proxy fails', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/i.png' },
      proxyFail: true,
    })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/fallback.json', 'mainnet'),
    ).resolves.toBe('blob:mock-icon')

    // the proxy + the 3 raced public gateways answered the icon bytes
    expect(iconCallsOf(fetchSpy)).toHaveLength(4)
    // invariant: only first-party https urls are requested, never raw ipfs://
    for (const [candidate] of fetchSpy.mock.calls) {
      expect(String(candidate)).toMatch(/^https:\/\//)
      expect(String(candidate)).not.toMatch(/^ipfs:\/\//)
    }
  })

  it('races gateways — a dead one loses the race without blocking', async () => {
    const fetchSpy = mockGateways({
      metadata: { tokenIcon: 'ipfs://bafyicon/i.png' },
      proxyFail: true,
    })
    // make the ipfs.io candidate fail for every request
    fetchSpy.mockImplementation(async (url) => {
      const target = String(url)
      if (target.startsWith('https://ipfs.io/')) {
        throw new Error('signal timed out')
      }
      if (target.includes('/api/ipfs-media/')) {
        return { ok: false, status: 404 }
      }
      if (target.includes('bafyicon')) return okImage()
      if (target.includes('bafymetadata')) {
        return okJson({ tokenIcon: 'ipfs://bafyicon/i.png' })
      }
      throw new Error(`unexpected url ${target}`)
    })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/slow.json', 'mainnet'),
    ).resolves.toBe('blob:mock-icon')

    // invariant: only first-party https urls are requested, never raw ipfs://
    for (const [candidate] of fetchSpy.mock.calls) {
      expect(String(candidate)).toMatch(/^https:\/\//)
      expect(String(candidate)).not.toMatch(/^ipfs:\/\//)
    }
  })

  it('caches a definitive no-icon answer with a TTL', async () => {
    const fetchSpy = mockGateways({ metadata: { name: 'no icon here' } })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon.json', 'mainnet'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // 3 gateways raced once for the metadata; the negative answer is cached
    expect(fetchSpy.mock.calls.length).toBe(3)
  })

  it('expires the negative no-icon cache after the TTL — the stale entry is dropped, not permanent poisoning', async () => {
    const fetchSpy = mockGateways({ metadata: { name: 'no icon here' } })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon-ttl.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // within the TTL the negative entry short-circuits silently
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/noicon-ttl.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    // jump past NEGATIVE_CACHE_TTL_MS (5min): the entry must expire instead
    // of short-circuiting forever. The metadata document is content-
    // addressed and permanently cached by design, so the expired negative
    // entry is dropped and the no-icon answer is re-derived locally — no
    // additional gateway traffic and no session-long poisoning. The
    // fetch-visible expiry contract is exercised end-to-end by the
    // resolveNftImage negative-path test below.
    const realNow = Date.now.bind(global.Date)
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => realNow() + 5 * 60 * 1000 + 1)
    try {
      await expect(
        resolveTokenIcon('ipfs://bafymetadata/noicon-ttl.json', 'mainnet'),
      ).resolves.toBeUndefined()
      expect(fetchSpy).toHaveBeenCalledTimes(3)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('does not cache implausible gateway junk — a 200 captive-portal answer cannot win the race permanently', async () => {
    // Promise.any crowns ANY 200-with-parseable-JSON response; a captive
    // portal / gateway error page must not poison the permanent
    // metadataCache for the session.
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafymetadata')) {
          return okJson({ portal: 'sign in', error: 'gateway overloaded' })
        }
        throw new Error(`unexpected url ${target}`)
      })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/junk.json', 'mainnet'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/junk.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // nothing cached: both resolutions race the 3 gateways again
    expect(fetchSpy).toHaveBeenCalledTimes(6)
  })

  it('negative-caches total gateway failures with the TTL — expiry re-races the gateways', async () => {
    // Every leg dead (404 everywhere) → a null lookup. Re-racing is futile
    // for the TTL window, so the failure is negative-cached; past the TTL
    // the entry expires and the gateways race again instead of
    // short-circuiting forever.
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 404 })

    await expect(
      resolveTokenIcon('ipfs://bafydead/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    // within the TTL the failure short-circuits — zero fetches
    await expect(
      resolveTokenIcon('ipfs://bafydead/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    // jump past NEGATIVE_CACHE_TTL_MS (5min): the entry expires and the
    // gateways race again
    const realNow = Date.now.bind(global.Date)
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => realNow() + 5 * 60 * 1000 + 1)
    try {
      await expect(
        resolveTokenIcon('ipfs://bafydead/doc.json', 'mainnet'),
      ).resolves.toBeUndefined()
      expect(fetchSpy).toHaveBeenCalledTimes(6)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('rejects over-cap content-length before reading the body', async () => {
    // The content-length header (bytes) is checked against the cap BEFORE
    // any body transfer: an honestly-announced oversized document costs a
    // header round-trip, not a download.
    const cap = 256 * 1024
    let bodyReads = 0
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => ({
        ok: true,
        headers: {
          get: (name) =>
            String(name).toLowerCase() === 'content-length'
              ? String(cap + 1)
              : null,
        },
        text: async () => {
          bodyReads += 1
          return '{}'
        },
      }))

    await expect(
      resolveTokenIcon('ipfs://bafyclen/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // every leg was convicted by its header alone — no body was read
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(bodyReads).toBe(0)
  })

  it('cuts off headerless streaming bodies once the byte budget is exceeded', async () => {
    // No content-length header: the body is read incrementally under a
    // cumulative byte budget — past the budget the reader is cancelled
    // (connection dropped) instead of draining an unbounded response.
    const cap = 256 * 1024
    const chunk = Uint8Array.from({ length: 200 * 1024 }, () => 65) // 'A' × 200KB
    const readers = []
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => ({
        ok: true,
        headers: { get: () => null },
        body: {
          getReader: () => {
            const reads = [
              { done: false, value: chunk },
              { done: false, value: chunk },
              { done: true, value: undefined },
            ]
            const reader = {
              read: jest.fn(() => Promise.resolve(reads.shift())),
              cancel: jest.fn(() => Promise.resolve()),
            }
            readers.push(reader)
            return reader
          },
        },
        text: async () => {
          throw new Error('text() must not run when a streaming body exists')
        },
      }))

    await expect(
      resolveTokenIcon('ipfs://bafystream/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // 3 legs, each cut off mid-stream at the budget: 2 chunks read
    // (400KB > 256KB), then the reader is cancelled
    expect(readers).toHaveLength(3)
    for (const reader of readers) {
      expect(reader.read).toHaveBeenCalledTimes(2)
      expect(reader.cancel).toHaveBeenCalledTimes(1)
    }
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('catches a lying short content-length via the decoded-text backstop', async () => {
    // A header claiming 10 bytes cannot smuggle an oversized body through:
    // the decoded text is re-checked in UTF-16 code units after buffering.
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => ({
        ok: true,
        headers: {
          get: (name) =>
            String(name).toLowerCase() === 'content-length' ? '10' : null,
        },
        text: async () => JSON.stringify({ name: 'A'.repeat(300 * 1024) }),
      }))

    await expect(
      resolveTokenIcon('ipfs://bafylie/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    // negative-cached within the TTL: the next resolution races nothing
    await resolveTokenIcon('ipfs://bafylie/doc.json', 'mainnet')
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('rejects oversized metadata on every leg — the futile lookup is negative-cached', async () => {
    // A huge but VALID metadata document must not be downloaded, parsed
    // and retained for the page lifetime: each over-cap leg fails exactly
    // like a dead gateway, and with every leg over the cap the lookup is
    // a failed lookup — nothing enters the session-long metadataCache,
    // and the futile retry is negative-cached with the TTL (ipfs content
    // is content-addressed: a dead document stays dead).
    const oversizedBody = JSON.stringify({ name: 'A'.repeat(3 * 1024 * 1024) })
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async () => ({
        ok: true,
        text: async () => oversizedBody,
      }))

    await expect(
      resolveTokenIcon('ipfs://bafybig/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // all 3 gateway legs raced and all failed the size cap
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    // negative-cached: the next resolution within the TTL races nothing
    await expect(
      resolveTokenIcon('ipfs://bafybig/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('falls back to an under-cap gateway leg when other legs exceed the metadata cap', async () => {
    const oversizedBody = JSON.stringify({ name: 'A'.repeat(3 * 1024 * 1024) })
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafyicon')) return okImage()
        if (target.includes('bafymixed')) {
          // two gateways answer over-cap; ipfs.io answers a usable doc
          if (target.startsWith('https://ipfs.io/')) {
            return {
              ok: true,
              text: async () =>
                JSON.stringify({ tokenIcon: 'ipfs://bafyicon/mixed.png' }),
            }
          }
          return { ok: true, text: async () => oversizedBody }
        }
        throw new Error(`unexpected url ${target}`)
      })

    await expect(
      resolveTokenIcon('ipfs://bafymixed/doc.json', 'mainnet'),
    ).resolves.toBe('blob:mock-icon')
    // every metadata leg raced; the winning document came from ipfs.io
    expect(
      fetchSpy.mock.calls.filter(([u]) => String(u).includes('bafymixed')),
    ).toHaveLength(3)
    expect(
      fetchSpy.mock.calls.some(
        ([u]) => String(u) === 'https://ipfs.io/ipfs/bafymixed/doc.json',
      ),
    ).toBe(true)
  })

  it('accepts metadata exactly at the size cap and caches it', async () => {
    // A document landing exactly on the cap is accepted, not rejected: the
    // byte budget must not clip legitimate (if unusually large) metadata.
    // The honest content-length header sits ON the cap — the pre-check is
    // an over-cap check, not an at-cap one. Test cap mirrors the
    // implementation's METADATA_MAX_BYTES = 256KB.
    const cap = 256 * 1024
    const base = JSON.stringify({ tokenIcon: 'ipfs://bafyicon/cap.png' })
    // `,"name":"` framing is 9 code units, the closing `"}` adds 2
    const atCapBody = `${base.slice(0, -1)},"name":"${'A'.repeat(
      cap - base.length - 10,
    )}"}`
    expect(atCapBody.length).toBe(cap)

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafyicon')) return okImage()
        if (target.includes('bafycap')) {
          return {
            ok: true,
            headers: {
              get: (name) =>
                String(name).toLowerCase() === 'content-length'
                  ? String(cap)
                  : null,
            },
            text: async () => atCapBody,
          }
        }
        throw new Error(`unexpected url ${target}`)
      })

    await expect(
      resolveTokenIcon('ipfs://bafycap/doc.json', 'mainnet'),
    ).resolves.toBe('blob:mock-icon')
    // 3 metadata gateway legs + exactly one first-party proxy icon request
    expect(fetchSpy).toHaveBeenCalledTimes(4)

    await resolveTokenIcon('ipfs://bafycap/doc.json', 'mainnet')
    // at-cap document cached: the second resolution is served from cache
    expect(fetchSpy).toHaveBeenCalledTimes(4)
  })

  it('bounds the metadata cache — eviction drops the least-RECENTLY-used doc', async () => {
    // Metadata whose icon bytes are unreachable keeps tokenIconCache empty
    // (icon failures are never cached), so metadataCache insertions, LRU
    // touches and evictions stay observable through metadata gateway
    // traffic. Pins the LRU end-to-end: EVERY resolution re-inserts the
    // entry at the newest slot (the read touch plus the bounded write-path
    // re-insert — a bare Map.set on an existing key would NOT reorder),
    // so eviction must drop uri[1], the least-RECENTLY-used doc, after
    // uri[0] was touched. Breaking re-insert ordering (miss-only inserts
    // → silent FIFO) evicts the untouched uri[0] instead and fails here.
    const metadataCallsOf = (spy) =>
      spy.mock.calls.filter(([u]) => String(u).includes('bafyfill')).length
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafyfill')) {
          return {
            ok: true,
            text: async () =>
              JSON.stringify({ tokenIcon: 'ipfs://bafyunreachable/x.png' }),
          }
        }
        throw new Error('signal timed out') // every icon leg fails
      })

    const uriOf = (i) => `ipfs://bafyfill${String(i).padStart(3, '0')}/m.json`
    // fill the cache exactly to its 500-entry bound
    for (let i = 0; i < 500; i++) {
      await resolveTokenIcon(uriOf(i), 'mainnet')
    }

    // touch uri[0]: a cache hit — the read re-inserts it as the newest
    // slot, zero gateway traffic
    const before = metadataCallsOf(fetchSpy)
    await resolveTokenIcon(uriOf(0), 'mainnet')
    expect(metadataCallsOf(fetchSpy)).toBe(before)

    // the 501st insertion is itself a fresh doc (3 gateway legs) and must
    // evict uri[1] — the least-RECENTLY-used doc now that uri[0] was just
    // touched — not uri[0]
    await resolveTokenIcon(uriOf(500), 'mainnet')
    expect(metadataCallsOf(fetchSpy)).toBe(before + 3)

    // uri[1] was evicted: resolving it races the 3 gateways again
    await resolveTokenIcon(uriOf(1), 'mainnet')
    expect(metadataCallsOf(fetchSpy)).toBe(before + 6)
    // uri[0] survived the eviction: resolving it touches again, 0 traffic
    await resolveTokenIcon(uriOf(0), 'mainnet')
    expect(metadataCallsOf(fetchSpy)).toBe(before + 6)
  })

  it('rejects non-ipfs metadata uris without any network request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
    await expect(
      resolveTokenIcon('https://evil.example/metadata.json', 'mainnet'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('http://localhost:8080/metadata.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects metadata uris with unsafe cid paths — the issuer cannot shape gateway paths', async () => {
    // '../' segments would normalize at fetch resolution
    // (ipfs://bafybase/../../x → https://gateway/x), letting the issuer
    // aim the metadata race at arbitrary paths on the fixed gateway hosts.
    const fetchSpy = jest.spyOn(global, 'fetch')
    await expect(
      resolveTokenIcon('ipfs://bafybase/../../escalate', 'mainnet'),
    ).resolves.toBeUndefined()
    await expect(
      resolveTokenIcon('ipfs://..%2fescape/doc.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('never fetches a non-gateway https icon_uri — the issuer cannot aim the wallet at an origin', async () => {
    // the shared beforeAll mock accumulates across tests: only this test's
    // calls matter here
    global.URL.createObjectURL.mockClear()
    const fetchSpy = mockGateways({
      metadata: { icon_uri: 'https://attacker.example/icon.png' },
    })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/evil.json', 'mainnet'),
    ).resolves.toBeUndefined()

    // only the 3 first-party gateway metadata requests happened; the
    // attacker-chosen origin was never contacted, no icon was built
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    for (const [candidate] of fetchSpy.mock.calls) {
      expect(String(candidate)).not.toContain('attacker.example')
    }
    expect(global.URL.createObjectURL).not.toHaveBeenCalled()

    // definitive no-usable-icon: negative-cached, the next refresh is silent
    await resolveTokenIcon('ipfs://bafymetadata/evil.json', 'mainnet')
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('rejects https icon urls that are not gateway spellings of ipfs content', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafymetadata')) {
          return okJson({
            icon: 'https://gateway.pinata.cloud/not-ipfs/icon.png',
          })
        }
        throw new Error(`unexpected url ${target}`)
      })

    await expect(
      resolveTokenIcon('ipfs://bafymetadata/notgw.json', 'mainnet'),
    ).resolves.toBeUndefined()
    // only the metadata race ran; the icon url was never fetched
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  it('converts gateway-hosted https icon urls into ipfs content behind the proxy', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (url) => {
        const target = String(url)
        if (
          target ===
          'https://lovelace.explorer.mintlayer.org/api/ipfs-media/bafyicon/pic.png'
        ) {
          return okImage()
        }
        if (target.includes('bafymetadata')) {
          return okJson({ icon: 'https://ipfs.io/ipfs/bafyicon/pic.png' })
        }
        throw new Error(`unexpected url ${target}`)
      })

    const url = await resolveTokenIcon(
      'ipfs://bafymetadata/gwhost.json',
      'testnet',
    )

    expect(url).toBe('blob:mock-icon')
    // 3 metadata gateway requests + exactly one proxy request: the
    // issuer-named https url itself is never contacted directly
    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(
      fetchSpy.mock.calls.some(
        ([u]) => String(u) === 'https://ipfs.io/ipfs/bafyicon/pic.png',
      ),
    ).toBe(false)
  })

  it('enforces the image content-type and size caps on icon bytes (proxy and gateway race)', async () => {
    global.URL.createObjectURL.mockClear()
    const wrongType = {
      ok: true,
      headers: { get: () => 'text/html' },
      blob: async () => ({ size: 10, type: 'text/html' }),
    }
    const tooBig = {
      ok: true,
      headers: { get: () => 'image/png' },
      blob: async () => ({ size: 5 * 1024 * 1024 + 1, type: 'image/png' }),
    }
    const mockAllIcons = (metadata, iconResponse) =>
      jest.spyOn(global, 'fetch').mockImplementation(async (url) => {
        const target = String(url)
        if (target.includes('bafymetadata')) return okJson(metadata)
        return iconResponse
      })

    // the proxy AND every gateway answer text/html → no usable icon
    mockAllIcons({ tokenIcon: 'ipfs://bafyicon/wrongtype.png' }, wrongType)
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/type.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(global.URL.createObjectURL).not.toHaveBeenCalled()

    // an oversized image is rejected on both legs as well
    const fetchSpy = mockAllIcons(
      { tokenIcon: 'ipfs://bafyicon/toobig.png' },
      tooBig,
    )
    await expect(
      resolveTokenIcon('ipfs://bafymetadata/size.json', 'mainnet'),
    ).resolves.toBeUndefined()
    expect(global.URL.createObjectURL).not.toHaveBeenCalled()
    expect(fetchSpy).toHaveBeenCalled()
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

  it('expires the negative cache after the TTL — a fresh fetch occurs instead of permanent poisoning', async () => {
    // everything 404s: the failure is negative-cached with a TTL
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 404 })

    const uri = 'ipfs://bafynegttl/cover.png'
    await expect(resolveNftImage(uri, 'mainnet')).resolves.toBeNull()
    // proxy + the 3 raced gateways
    expect(fetchSpy).toHaveBeenCalledTimes(4)
    // within the TTL the negative entry short-circuits — zero fetches
    await expect(resolveNftImage(uri, 'mainnet')).resolves.toBeNull()
    expect(fetchSpy).toHaveBeenCalledTimes(4)

    // jump past NEGATIVE_CACHE_TTL_MS (5min): the entry expires and the
    // next call fetches fresh instead of replaying the cached failure
    const realNow = Date.now.bind(global.Date)
    const nowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => realNow() + 5 * 60 * 1000 + 1)
    try {
      await expect(resolveNftImage(uri, 'mainnet')).resolves.toBeNull()
      expect(fetchSpy).toHaveBeenCalledTimes(8)
    } finally {
      nowSpy.mockRestore()
    }
  })
})
