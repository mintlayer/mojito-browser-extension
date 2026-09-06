/**
 * Tests for the injected `window.mojito` provider (public/mojito.js) against
 * the @mintlayer/sdk contract:
 * - connect() resolves the session (SDK reads `addressesByChain.mintlayer`)
 * - restore() resolves the stored session or null, unique request ids
 * - errors carry a machine-readable `code`
 * - disconnect() revokes the wallet-side session and clears page state
 */
const fs = require('fs')
const path = require('path')

const MOJITO_SRC = fs.readFileSync(path.join(__dirname, 'mojito.js'), 'utf8')

// jsdom's MessageEvent.source is a different wrapper object than the global
// window (in browsers they are identical), which would make the provider's
// `event.source !== window` guard drop every message.
Object.defineProperty(MessageEvent.prototype, 'source', {
  get: () => window,
  configurable: true,
})

describe('window.mojito provider', () => {
  let responses // requestId -> result/error queued by the fake content script
  let seenRequestIds // emulates the content script duplicate-request guard
  let postedEvents
  const messageListeners = new Set()

  const onMessage = (fn) => {
    messageListeners.add(fn)
    window.addEventListener('message', fn)
  }

  // Fake content script: answers MINTLAYER_REQUEST messages from the queue,
  // with the same duplicate-request semantics as the real one. The queued
  // payload is looked up after a tick so listeners registered later in a
  // test can still queue a reply for the request they just observed.
  const installContentScript = () => {
    onMessage((event) => {
      if (event.data?.type !== 'MINTLAYER_REQUEST') return
      const { requestId } = event.data
      if (seenRequestIds.has(requestId)) return
      seenRequestIds.add(requestId)

      setTimeout(() => {
        const payload = responses.get(requestId)
        if (!payload) return
        window.postMessage(
          { type: 'MINTLAYER_RESPONSE', requestId, ...payload },
          '*',
        )
      }, 0)
    })
  }

  // Answers every getSession with the given session (like a connected
  // background would).
  const answerGetSessions = (session) => {
    onMessage((event) => {
      if (event.data?.type !== 'MINTLAYER_REQUEST') return
      if (event.data.method !== 'getSession') return
      const { requestId } = event.data
      setTimeout(() => {
        window.postMessage(
          { type: 'MINTLAYER_RESPONSE', requestId, result: session },
          '*',
        )
      }, 0)
    })
  }

  const flushMessages = () => new Promise((resolve) => setTimeout(resolve, 0))

  beforeEach(() => {
    responses = new Map()
    seenRequestIds = new Set()
    postedEvents = []
    window.mojito = undefined

    onMessage((event) => {
      if (event.data?.type === 'MINTLAYER_EVENT') postedEvents.push(event.data)
    })
    installContentScript()
    // eslint-disable-next-line no-eval
    window.eval(MOJITO_SRC)
  })

  afterEach(() => {
    for (const fn of messageListeners) {
      window.removeEventListener('message', fn)
    }
    messageListeners.clear()
  })

  describe('surface', () => {
    it('exposes the methods the @mintlayer/sdk provider calls', () => {
      expect(typeof window.mojito.connect).toBe('function')
      expect(typeof window.mojito.restore).toBe('function')
      expect(typeof window.mojito.disconnect).toBe('function')
      expect(typeof window.mojito.request).toBe('function')
      expect(typeof window.mojito.isConnected).toBe('function')
      // Client.create({ autoRestore: !!window.mojito?.restore })
      expect(!!window.mojito?.restore).toBe(true)
    })
  })

  describe('connect', () => {
    it('resolves the session and tracks the per-network address map', async () => {
      const session = {
        address: {
          testnet: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] },
        },
        addressesByChain: {
          mintlayer: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] },
        },
        network: 'testnet',
      }
      onMessage((event) => {
        if (event.data?.type !== 'MINTLAYER_REQUEST') return
        if (event.data.method !== 'connect') return
        const { requestId } = event.data
        setTimeout(() => {
          window.postMessage(
            { type: 'MINTLAYER_RESPONSE', requestId, result: session },
            '*',
          )
        }, 0)
      })

      const result = await window.mojito.connect()

      // SDK Client.connect(): addresses.addressesByChain.mintlayer
      expect(result.addressesByChain.mintlayer.receiving).toEqual(['tmtc1qabc'])
      expect(window.mojito.connectedAddresses.testnet.receiving).toEqual([
        'tmtc1qabc',
      ])
      expect(window.mojito.network).toBe('testnet')
    })

    it('rejects with the structured error code when the user denies', async () => {
      onMessage((event) => {
        if (event.data?.type !== 'MINTLAYER_REQUEST') return
        const { requestId } = event.data
        setTimeout(() => {
          window.postMessage(
            {
              type: 'MINTLAYER_RESPONSE',
              requestId,
              error: {
                code: 'USER_REJECTED',
                message: 'User rejected the request',
              },
            },
            '*',
          )
        }, 0)
      })

      await expect(window.mojito.connect()).rejects.toMatchObject({
        code: 'USER_REJECTED',
        message: 'User rejected the request',
      })
    })
  })

  describe('restore', () => {
    it('resolves the full session (SDK reads addressesByChain) after reload', async () => {
      const session = {
        address: {
          mainnet: { receiving: ['mtc1qxyz'], change: ['mtc1qchg'] },
        },
        addressesByChain: {
          mintlayer: { receiving: ['mtc1qxyz'], change: ['mtc1qchg'] },
        },
        network: 'mainnet',
      }
      answerGetSessions(session)

      const restored = await window.mojito.restore()

      expect(restored.addressesByChain.mintlayer.receiving).toEqual([
        'mtc1qxyz',
      ])
      expect(window.mojito.network).toBe('mainnet')
      expect(window.mojito.isConnected()).toBe(true)
    })

    it('resolves null when no grant exists (no auto-restore)', async () => {
      answerGetSessions(null)

      await expect(window.mojito.restore()).resolves.toBeNull()
    })

    it('two concurrent restores both resolve (no fixed request id)', async () => {
      const session = {
        address: { testnet: { receiving: ['tmtc1qabc'], change: [] } },
        addressesByChain: {
          mintlayer: { receiving: ['tmtc1qabc'], change: [] },
        },
        network: 'testnet',
      }
      answerGetSessions(session)

      // The duplicate-request guard used to hang the second call when the
      // id was the fixed '__restore' string.
      const [first, second] = await Promise.all([
        window.mojito.restore(),
        window.mojito.restore(),
      ])
      expect(first).toEqual(session)
      expect(second).toEqual(session)
    })
  })

  describe('disconnect', () => {
    it('clears page state, notifies the page and asks the wallet to revoke', async () => {
      window.mojito.connectedAddresses = {
        testnet: { receiving: ['tmtc1qabc'], change: [] },
      }

      onMessage((event) => {
        if (event.data?.type !== 'MINTLAYER_REQUEST') return
        const { requestId, method } = event.data
        expect(method).toBe('disconnect')
        setTimeout(() => {
          window.postMessage(
            { type: 'MINTLAYER_RESPONSE', requestId, result: true },
            '*',
          )
        }, 0)
      })

      await window.mojito.disconnect()
      // allow the posted MINTLAYER_EVENT to dispatch
      await flushMessages()

      expect(window.mojito.isConnected()).toBe(false)
      expect(
        postedEvents.some(
          (e) => e.event === 'disconnect' && e.type === 'MINTLAYER_EVENT',
        ),
      ).toBe(true)
    })
  })
})
