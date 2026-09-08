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
// Chromium content-script senders carry the tab the dApp runs in: the
// side-panel approval surface keys its requests off the tab's WINDOW id.
const tabDappSender = {
  ...dappSender,
  tab: { id: 5, windowId: 3 },
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
        // self-healing sweep registers itself here on load
        onInstalled: { addListener: jest.fn() },
        onStartup: { addListener: jest.fn() },
        lastError: null,
      },
      // used by the sweep to re-inject dead content scripts
      scripting: {
        executeScript: jest.fn().mockResolvedValue([]),
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
      sidePanel: {
        open: jest.fn().mockResolvedValue(undefined),
      },
      // used only by notifyOriginRevoked (revocation broadcast to open tabs)
      tabs: {
        query: jest.fn((query, cb) => cb([{ id: 1 }, { id: 2 }])),
        sendMessage: jest.fn(),
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
      // keyed by the window that will show the approval
      expect(storageData['pendingRequest:700']).toMatchObject({
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
          windowId: 700,
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
      expect(storageData['pendingRequest:700']).toBeUndefined()
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
          windowId: 700,
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
          windowId: 700,
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
          windowId: 700,
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
      expect(storageData['pendingRequest:701']).toMatchObject({
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
          windowId: 700,
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
          windowId: 700,
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
          windowId: 700,
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
  describe('concurrent approval windows (the blocker scenario)', () => {
    it('a connect window and a signing window keep separate pending requests', () => {
      // origin A opens a connect approval (window 700) and approves it
      dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        {
          id: 'site-a',
          origin: 'https://a.example',
          url: 'https://a.example/',
        },
      )
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://a.example',
          windowId: 700,
          result: {
            address: { testnet: { receiving: ['tmtc1qabc'], change: [] } },
            addressesByChain: {
              mintlayer: { receiving: ['tmtc1qabc'], change: [] },
            },
            network: 'testnet',
          },
        },
        extensionSender,
      )
      // while A's connect window is pending, a signing approval opens
      // (window 701) for the same origin
      dispatch(
        {
          requestId: 's1',
          method: 'signTransaction',
          params: { txData: { JSONRepresentation: {} } },
        },
        {
          id: 'site-a',
          origin: 'https://a.example',
          url: 'https://a.example/',
        },
      )

      // the connect request was consumed on approval; the signing window
      // has its own record — the two never overwrote each other
      expect(storageData['pendingRequest:700']).toBeUndefined()
      expect(storageData['pendingRequest:701']).toMatchObject({
        action: 'signTransaction',
        requestId: 's1',
        network: 'testnet',
      })
    })
  })

  describe('side-panel approval surface (dApp request from a tab)', () => {
    it('opens the side panel on the dApp tab instead of a popup window', () => {
      const { reply, keptOpen } = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        tabDappSender,
      )

      // the panel is opened on the dApp's TAB
      expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 5 })
      // the panel path creates NO popup window
      expect(createdWindows).toHaveLength(0)
      // the request is keyed by the dApp tab's WINDOW id (3), not the tab id
      expect(storageData['pendingRequest:3']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
        requestId: 'r1',
      })
      expect(storageData['pendingRequest:5']).toBeUndefined()
      // the channel stays open until the approval answers it
      expect(keptOpen).toBe(true)
      expect(reply.current).toBeUndefined()
    })

    it('falls back to a popup window when the side panel cannot open', async () => {
      global.chrome.sidePanel.open.mockRejectedValue(new Error('no gesture'))

      const connect = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        tabDappSender,
      )
      expect(connect.keptOpen).toBe(true)

      // let the sidePanel.open rejection settle and the fallback run
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()

      expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 5 })
      // the fallback opens ONE popup window (id 700 per the mock)
      expect(createdWindows).toHaveLength(1)
      // the request now lives under the popup's window id
      expect(storageData['pendingRequest:700']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
        requestId: 'r1',
      })
      // the panel registration was rolled back
      expect(storageData['pendingRequest:3']).toBeUndefined()

      // approving in the popup resolves the ORIGINAL dApp channel
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          windowId: 700,
          result: sessionData,
        },
        extensionSender,
      )

      expect(connect.reply.current.result).toEqual(sessionData)
      // and the pending request is consumed
      expect(storageData['pendingRequest:700']).toBeUndefined()
    })

    it('answers REQUEST_IN_PROGRESS for a second request while the panel approval is pending', () => {
      dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        tabDappSender,
      )

      const second = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        tabDappSender,
      )

      expect(second.reply.current).toMatchObject({
        error: { code: 'REQUEST_IN_PROGRESS' },
      })
      expect(second.keptOpen).toBe(false)
      // the busy answer must not have opened any approval window
      expect(createdWindows).toHaveLength(0)
    })

    // Chrome silently no-ops sidePanel.open() without a user gesture: the
    // promise resolves but nothing opens. The background therefore waits for
    // an `approvalDisplayed` ack from the panel and falls back to a popup
    // when it does not arrive within 2s.
    describe('ack-or-fallback (silent sidePanel.open no-op)', () => {
      const flushMicrotasks = async () => {
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      }

      it('cancels the popup fallback when the panel acks approvalDisplayed in time', async () => {
        jest.useFakeTimers()
        try {
          const connect = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            tabDappSender,
          )
          expect(connect.keptOpen).toBe(true)

          // let sidePanel.open resolve
          await flushMicrotasks()
          expect(createdWindows).toHaveLength(0)

          // the panel confirms it rendered the approval
          dispatch(
            { action: 'approvalDisplayed', requestId: 'r1' },
            extensionSender,
          )

          // the fallback window would have fired within this window
          jest.advanceTimersByTime(2000)
          await flushMicrotasks()

          // NO popup was created
          expect(createdWindows).toHaveLength(0)
          expect(storageData['pendingRequest:700']).toBeUndefined()
          // the panel registration survives: the panel owns this request now
          expect(storageData['pendingRequest:3']).toMatchObject({
            action: 'connect',
            requestId: 'r1',
          })
          // the dApp's channel is still open, awaiting the panel's decision
          expect(connect.reply.current).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })

      it('falls back to a popup window when no ack arrives within 2s', async () => {
        jest.useFakeTimers()
        try {
          const connect = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            tabDappSender,
          )
          expect(connect.keptOpen).toBe(true)

          await flushMicrotasks()
          // sidePanel.open resolved, but the panel never acked
          expect(createdWindows).toHaveLength(0)

          jest.advanceTimersByTime(2000)
          await flushMicrotasks()

          // the panel registration was rolled back...
          expect(storageData['pendingRequest:3']).toBeUndefined()
          // ...and a POPUP fallback was created, re-keyed for its window
          expect(createdWindows).toHaveLength(1)
          expect(storageData['pendingRequest:700']).toMatchObject({
            action: 'connect',
            origin: 'https://bridge.example',
            requestId: 'r1',
          })
          // the ORIGINAL dApp channel is still the one being answered
          expect(connect.reply.current).toBeUndefined()

          // approving in the popup resolves the original channel
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: 'r1',
              origin: 'https://bridge.example',
              windowId: 700,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)
          expect(storageData['pendingRequest:700']).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })

      it('ignores an approvalDisplayed ack forged from a web page sender', async () => {
        jest.useFakeTimers()
        try {
          dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            tabDappSender,
          )

          await flushMicrotasks()

          // a dApp page tries to forge the panel's "displayed" ack
          dispatch({ action: 'approvalDisplayed', requestId: 'r1' }, dappSender)

          jest.advanceTimersByTime(2000)
          await flushMicrotasks()

          // the forged ack was ignored: the popup fallback happened anyway
          expect(createdWindows).toHaveLength(1)
          expect(storageData['pendingRequest:700']).toMatchObject({
            requestId: 'r1',
          })
          expect(storageData['pendingRequest:3']).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })
    })
  })

  describe('revocation propagation (disconnectSite)', () => {
    const connectAndApprove = () => {
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: 'r1',
          origin: 'https://bridge.example',
          windowId: 700,
          result: sessionData,
        },
        extensionSender,
      )
    }

    it('broadcasts MOJITO_SESSION_REVOKED to every open tab and removes the grant', () => {
      connectAndApprove()

      const { reply } = dispatch(
        { action: 'disconnectSite', origin: 'https://bridge.example' },
        extensionSender,
      )

      expect(reply.current.result).toEqual({
        origin: 'https://bridge.example',
      })
      // every tab is notified so no page keeps acting on the dead grant
      expect(global.chrome.tabs.query).toHaveBeenCalledWith(
        {},
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )
      // and the grant is durably gone
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toBeUndefined()
    })

    it('a revoked site can never shortcut-connect again (bypass regression)', () => {
      connectAndApprove()
      dispatch(
        { action: 'disconnectSite', origin: 'https://bridge.example' },
        extensionSender,
      )
      expect(storageData.connectedSites).toEqual({})

      const reconnect = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        dappSender,
      )

      // NOT the stored session: the channel stays open for a fresh approval
      expect(reconnect.reply.current).toBeUndefined()
      expect(reconnect.keptOpen).toBe(true)
      // a NEW approval window was created (the first was 700)
      expect(createdWindows).toHaveLength(2)
      expect(storageData['pendingRequest:701']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
        requestId: 'r2',
      })
    })
  })

  describe('self-healing content-script injection', () => {
    const CONTENT_SCRIPT_FILE = 'explorer/content-script.js'

    // A reload/update wipes content scripts from already-open tabs. The
    // sweep pings every tab and re-injects where the ping goes unanswered
    // (MV3 signals that via runtime.lastError, not a throw).
    const useSweepTabs = () => {
      // includes a tab with a non-numeric id: the sweep must skip it
      global.chrome.tabs.query.mockImplementation((query, cb) =>
        cb([{ id: 1 }, { id: 2 }, { id: 'no-id' }]),
      )
    }

    const registeredListener = (event) => {
      expect(event.addListener).toHaveBeenCalledTimes(1)
      return event.addListener.mock.calls[0][0]
    }

    // Fire the callbacks the sweep stored on tabs.sendMessage. lastError is
    // shared mutable state across the whole chrome mock: set it only around
    // each invocation and delete it afterwards so nothing leaks into later
    // callbacks or tests.
    const answerPings = ({ withLastError }) => {
      for (const call of global.chrome.tabs.sendMessage.mock.calls) {
        const sendCallback = call[2]
        if (typeof sendCallback !== 'function') continue
        if (withLastError) {
          global.chrome.runtime.lastError = { message: 'context invalidated' }
        }
        try {
          sendCallback()
        } finally {
          delete global.chrome.runtime.lastError
        }
      }
    }

    afterEach(() => {
      delete global.chrome.runtime.lastError
    })

    it('sweeps every open tab on install/update and re-injects where the content script is dead', () => {
      useSweepTabs()
      const onInstalledListener = registeredListener(
        global.chrome.runtime.onInstalled,
      )

      onInstalledListener()

      // every numerically-id'd tab was pinged...
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_PING' },
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2,
        { type: 'MOJITO_PING' },
        expect.any(Function),
      )
      // ...but the non-numeric-id tab was never touched
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        'no-id',
        expect.anything(),
        expect.anything(),
      )
      // pings alone inject nothing: injection happens only when a ping
      // comes back with lastError (the default mock never answers)
      expect(global.chrome.scripting.executeScript).not.toHaveBeenCalled()

      // the pings now answer as dead content scripts (extension reloaded)
      answerPings({ withLastError: true })

      expect(global.chrome.scripting.executeScript).toHaveBeenCalledTimes(2)
      expect(global.chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: [CONTENT_SCRIPT_FILE],
      })
      expect(global.chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 2 },
        files: [CONTENT_SCRIPT_FILE],
      })
    })

    it('does not re-inject when the content script is alive (no lastError)', () => {
      useSweepTabs()
      registeredListener(global.chrome.runtime.onInstalled)()

      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)

      // every ping answers cleanly: the content scripts are alive
      answerPings({ withLastError: false })

      expect(global.chrome.scripting.executeScript).not.toHaveBeenCalled()
    })

    it('runs the same sweep on browser start (onStartup)', () => {
      useSweepTabs()
      const onStartupListener = registeredListener(
        global.chrome.runtime.onStartup,
      )

      onStartupListener()

      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_PING' },
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2,
        { type: 'MOJITO_PING' },
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        'no-id',
        expect.anything(),
        expect.anything(),
      )

      // dead content scripts on startup get re-injected too
      answerPings({ withLastError: true })
      expect(global.chrome.scripting.executeScript).toHaveBeenCalledTimes(2)
    })
  })
})
