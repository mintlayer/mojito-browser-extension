/**
 * Tests for the background service worker (public/background.js) covering the
 * bridge-integration contract: connect approval + session persistence
 * (addressesByChain + network), structured error codes, sign-request network
 * stamping, and disconnect actually revoking the session.
 */
const fs = require('fs')
const path = require('path')

const BACKGROUND_SRC = fs.readFileSync(
  path.join(__dirname, 'background.js'),
  'utf8',
)

const EXT_ID = 'ext-id-123'

const dappSender = {
  id: 'some-site',
  origin: 'https://bridge.example',
  url: 'https://bridge.example/page',
}
const extensionSender = {
  id: EXT_ID,
  origin: `chrome-extension://${EXT_ID}`,
  url: `chrome-extension://${EXT_ID}/index.html`,
}

describe('background service worker', () => {
  let messageListeners
  let storageData
  let createdWindows

  const loadBackground = () => {
    // eslint-disable-next-line no-eval
    window.eval(BACKGROUND_SRC)
  }

  const dispatch = (message, sender) => {
    // The reply object is stable: an async approval answers the ORIGINAL
    // dispatch's channel later (e.g. from a popupResponse dispatch).
    const reply = { current: undefined }
    const sendResponse = (response) => {
      reply.current = response
    }
    let keptOpen = false
    for (const listener of messageListeners) {
      // listeners return true when they will respond asynchronously
      // eslint-disable-next-line no-return-assign
      keptOpen = keptOpen || listener(message, sender, sendResponse) === true
    }
    return { reply, keptOpen }
  }

  beforeEach(() => {
    jest.resetModules()
    messageListeners = []
    storageData = {}
    createdWindows = []

    global.browser = undefined
    global.chrome = {
      runtime: {
        id: EXT_ID,
        getURL: (p) => `chrome-extension://${EXT_ID}/${p}`,
        getManifest: () => ({ version: '1.6.1' }),
        onMessage: {
          addListener: (fn) => messageListeners.push(fn),
        },
        lastError: null,
      },
      storage: {
        local: {
          get: (keys, cb) => {
            const result = {}
            for (const key of keys) {
              if (key in storageData)
                result[key] = JSON.parse(JSON.stringify(storageData[key]))
            }
            cb(result)
          },
          set: (obj, cb) => {
            Object.assign(storageData, JSON.parse(JSON.stringify(obj)))
            cb && cb()
          },
          remove: (key, cb) => {
            delete storageData[key]
            cb && cb()
          },
        },
      },
      windows: {
        create: (opts, cb) => {
          const win = { id: 700 + createdWindows.length }
          createdWindows.push(win)
          cb(win)
        },
        get: (id, cb) => cb({ id }),
        update: (id, opts, cb) => cb && cb({ id }),
        onRemoved: { addListener: () => {} },
      },
    }

    loadBackground()
  })

  const sessionData = {
    address: { testnet: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] } },
    addressesByChain: {
      mintlayer: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] },
    },
    network: 'testnet',
  }

  describe('connect', () => {
    it('opens one approval window and keeps the channel open', () => {
      const { reply, keptOpen } = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        dappSender,
      )

      expect(reply.current).toBeUndefined()
      expect(keptOpen).toBe(true)
      expect(createdWindows).toHaveLength(1)
      expect(storageData.pendingRequest).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
        requestId: 'r1',
      })
    })

    it('persists the full session (addressesByChain + network) on approval', () => {
      // the approval answers the ORIGINAL connect channel
      const connect = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        dappSender,
      )
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )

      expect(connect.reply.current.result).toEqual(sessionData)
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toMatchObject({
        address: sessionData.address,
        addressesByChain: sessionData.addressesByChain,
        network: 'testnet',
      })
      // the pending request is consumed
      expect(storageData.pendingRequest).toBeUndefined()
    })

    it('rejects with USER_REJECTED when the wallet denies', () => {
      const connect = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        dappSender,
      )
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r2',
          origin: 'https://bridge.example',
          result: null,
        },
        extensionSender,
      )

      expect(connect.reply.current.error).toMatchObject({
        code: 'USER_REJECTED',
        message: expect.stringContaining('rejected'),
      })
    })

    it('answers an already-connected site immediately, without a popup', () => {
      const connect = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        dappSender,
      )
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )

      const { keptOpen } = dispatch(
        { requestId: 'r9', method: 'connect', params: {} },
        dappSender,
      )
      expect(keptOpen).toBe(false)
      expect(createdWindows).toHaveLength(1) // no second window
      // the repeat request is answered synchronously with the stored session
      const repeat = dispatch(
        { requestId: 'r10', method: 'connect', params: {} },
        dappSender,
      )
      expect(
        repeat.reply.current.result.addressesByChain.mintlayer.receiving,
      ).toEqual(['tmtc1qabc'])
    })

    it('ignores popup responses from non-extension senders', () => {
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      const { reply } = dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        dappSender, // a web page trying to forge an approval
      )

      expect(reply.current).toBeUndefined()
    })
  })

  describe('signTransaction', () => {
    beforeEach(() => {
      // establish a connection first
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )
    })

    it('stamps the request with the session network for the wrong-chain guard', () => {
      const { keptOpen } = dispatch(
        {
          requestId: 's1',
          method: 'signTransaction',
          params: { txData: { JSONRepresentation: {} } },
        },
        dappSender,
      )

      expect(keptOpen).toBe(true)
      expect(storageData.pendingRequest).toMatchObject({
        action: 'signTransaction',
        network: 'testnet',
        data: { txData: { JSONRepresentation: {} } },
      })
    })

    it('rejects with NOT_CONNECTED when the site never connected', () => {
      const { reply } = dispatch(
        { requestId: 's2', method: 'signTransaction', params: {} },
        {
          id: 'other',
          origin: 'https://evil.example',
          url: 'https://evil.example/',
        },
      )

      expect(reply.current.error).toMatchObject({ code: 'NOT_CONNECTED' })
    })
  })

  describe('getSession / disconnect (restore + revocation)', () => {
    it('returns the full session for a connected origin', () => {
      storageData.connectedSites = {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      }
      // re-sync the worker's in-memory map via a connect+approve
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )

      const { reply: getSessionReply } = dispatch(
        { method: 'getSession' },
        dappSender,
      )
      expect(getSessionReply.current.result).toEqual({
        address: sessionData.address,
        addressesByChain: sessionData.addressesByChain,
        network: 'testnet',
      })
    })

    it('disconnect revokes the grant: getSession returns null afterwards', () => {
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )

      const { reply } = dispatch({ method: 'disconnect' }, dappSender)
      expect(reply.current.result).toBe(true)
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toBeUndefined()

      const session = dispatch({ method: 'getSession' }, dappSender)
      expect(session.reply.current.result).toBeNull()
    })

    it('ignores disconnect forged from a web page sender', () => {
      // forge from a different origin: it must not delete the target origin
      storageData.connectedSites = {
        'https://bridge.example': { address: sessionData.address },
      }
      const { reply } = dispatch(
        { method: 'disconnect' },
        {
          id: 'other',
          origin: 'https://evil.example',
          url: 'https://evil.example/',
        },
      )

      expect(reply.current.result).toBe(true) // nothing to delete for evil.example
      // and it only deletes its OWN origin — bridge.example untouched
      // (in-memory map is seeded through connect/approve only, so assert
      // via a real connect+approve cycle):
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          result: sessionData,
        },
        extensionSender,
      )
      dispatch(
        { method: 'disconnect' },
        {
          id: 'other',
          origin: 'https://evil.example',
          url: 'https://evil.example/',
        },
      )
      expect(storageData.connectedSites['https://bridge.example']).toBeDefined()
    })
  })

  describe('errors', () => {
    it('unknown methods get a machine-readable code', () => {
      const { reply } = dispatch({ method: 'requestSecretHash' }, dappSender)
      expect(reply.current.error).toMatchObject({
        code: 'UNSUPPORTED_METHOD',
        message: expect.stringContaining('requestSecretHash'),
      })
    })
  })
})
