/**
 * Tests for the background service worker (src/background/main.js) covering
 * the bridge-integration contract: connect approval + session persistence
 * (addressesByChain + network), structured error codes, sign-request network
 * stamping, and disconnect actually revoking the session.
 */
const { initBackground } = require('./main.js')

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
  let windowRemovedListeners
  let storageChangeListeners

  const loadBackground = () => {
    // The WXT entrypoint wraps the original IIFE body in a factory; each
    // test boots a fresh worker instance by invoking it again.
    initBackground()
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
    windowRemovedListeners = []
    storageChangeListeners = []

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
        // the background tracks the wallet UI's active network through the
        // 'networkType' key it persists to chrome.storage.local
        onChanged: {
          addListener: (fn) => storageChangeListeners.push(fn),
        },
      },
      windows: {
        create: jest.fn((opts, cb) => {
          const win = { id: 700 + createdWindows.length }
          createdWindows.push(win)
          cb(win)
        }),
        get: (id, cb) => cb({ id }),
        update: (id, opts, cb) => cb && cb({ id }),
        // the overlap model DISMISSES the losing surface instead of
        // letting it steal/replace the winner
        remove: jest.fn((id, cb) => cb && cb()),
        // the background registers cleanup here: an approval window closed
        // without a decision must answer (cancel) the waiting dApp instead
        // of hanging it forever
        onRemoved: { addListener: (fn) => windowRemovedListeners.push(fn) },
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

  // Approvals are routed by a BACKGROUND-GENERATED opaque id (the dApp's
  // requestId is never used for routing). The approval UI echoes the id it
  // was given via storage — tests do the same.
  const internalIdFor = (windowId) =>
    storageData[`pendingRequest:${windowId}`]?.requestId

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
        requestId: expect.any(String),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
          requestId: internalIdFor(700),
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
        requestId: expect.any(String),
        network: 'testnet',
      })
    })
  })

  // ── S1 regression: request-id collision cannot cross-deliver results ──
  // Approvals are routed by the background's internal opaque id. Two pages
  // sending the SAME dApp requestId must get independent internal ids and
  // their answers must go to their own channels only.
  it('keeps identical dApp requestIds on different origins isolated', async () => {
    const flush = async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    }
    const victim = {
      ...tabDappSender,
      origin: 'https://shop.example',
      url: 'https://shop.example/page',
    }
    const attacker = {
      ...tabDappSender,
      origin: 'https://evil.example',
      url: 'https://evil.example/page',
      tab: { id: 6, windowId: 9 },
    }

    // Pre-grant the victim so it can sign; the attacker never connects.
    dispatch({ requestId: 'pre', method: 'connect', params: {} }, victim)
    await flush()
    dispatch(
      {
        action: 'popupResponse',
        method: 'connect',
        requestId: internalIdFor(3),
        origin: 'https://shop.example',
        windowId: 3,
        result: sessionData,
      },
      extensionSender,
    )
    expect(storageData['connectedSites']['https://shop.example']).toBeTruthy()

    // SAME dApp requestId from two origins, two approval slots:
    const sign = dispatch(
      { requestId: 'dup', method: 'signTransaction', params: {} },
      victim,
    )
    await flush()
    const connect = dispatch(
      { requestId: 'dup', method: 'connect', params: {} },
      attacker,
    )
    await flush()

    // both approvals are live with independent internal ids
    expect(storageData['pendingRequest:3'].requestId).not.toBe('dup')
    expect(typeof storageData['pendingRequest:3'].requestId).toBe('string')
    expect(sign.reply.current).toBeUndefined()
    expect(connect.reply.current).toBeUndefined()

    // the user approves the VICTIM's signing request
    dispatch(
      {
        action: 'popupResponse',
        method: 'signTransaction_approve',
        requestId: storageData['pendingRequest:3'].requestId,
        origin: 'https://shop.example',
        windowId: 3,
        result: { signedTxHex: 'deadbeef' },
      },
      extensionSender,
    )

    // the signature lands on the VICTIM's channel…
    expect(sign.reply.current).toMatchObject({
      result: { signedTxHex: 'deadbeef' },
    })
    // …and NEVER on the attacker's waiting connect channel
    expect(connect.reply.current).toBeUndefined()

    // the attacker's connect approval is still live and answers only its
    // own channel when approved
    dispatch(
      {
        action: 'popupResponse',
        method: 'connect',
        requestId: storageData['pendingRequest:9'].requestId,
        origin: 'https://evil.example',
        windowId: 9,
        result: sessionData,
      },
      extensionSender,
    )
    expect(connect.reply.current).toMatchObject({ result: sessionData })
  })

  describe('side-panel approval surface (dApp request from a tab)', () => {
    // The mock sidePanel.open resolves immediately, but the pending request
    // is persisted only in the .then() of that promise (gesture-first
    // ordering): storage assertions need a microtask flush first.
    const flushMicrotasks = async () => {
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
    }

    it('opens the side panel on the dApp tab instead of a popup window', async () => {
      const { reply, keptOpen } = dispatch(
        { requestId: 'r1', method: 'connect', params: {} },
        tabDappSender,
      )

      // gesture-first ordering: sidePanel.open is called SYNCHRONOUSLY when
      // the dApp request arrives — Chrome silently no-ops a gestureless
      // open, and the user gesture that produced this request can expire
      // across async hops (e.g. a storage round-trip). This assertion
      // deliberately stays before any await.
      expect(global.chrome.sidePanel.open).toHaveBeenCalledWith({ tabId: 5 })
      // the panel path creates NO popup window
      expect(createdWindows).toHaveLength(0)

      // the pending request is persisted only AFTER the open promise
      // resolves
      await flushMicrotasks()

      // the request is keyed by the dApp tab's WINDOW id (3), not the tab id
      expect(storageData['pendingRequest:3']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
        requestId: expect.any(String),
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
        requestId: expect.any(String),
      })
      // the panel registration was rolled back
      expect(storageData['pendingRequest:3']).toBeUndefined()

      // approving in the popup resolves the ORIGINAL dApp channel
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: internalIdFor(700),
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
    // an `approvalDisplayed` ack from the panel and, when none arrives
    // within 8s, opens a popup as a SECOND surface (never a replacement):
    // the panel registration is kept so a late-loading panel can still
    // claim the request — the first surface to display or answer owns it.
    describe('ack-or-fallback (silent sidePanel.open no-op)', () => {
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
            { action: 'approvalDisplayed', requestId: internalIdFor(3) },
            extensionSender,
          )

          // the fallback popup would have fired within this window
          jest.advanceTimersByTime(8000)
          await flushMicrotasks()

          // NO popup was created
          expect(createdWindows).toHaveLength(0)
          expect(storageData['pendingRequest:700']).toBeUndefined()
          // the panel registration survives: the panel owns this request now
          expect(storageData['pendingRequest:3']).toMatchObject({
            action: 'connect',
            requestId: expect.any(String),
          })
          // the dApp's channel is still open, awaiting the panel's decision
          expect(connect.reply.current).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })

      it('opens a popup as a second surface when no ack arrives within 8s', async () => {
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

          jest.advanceTimersByTime(8000)
          await flushMicrotasks()

          // the panel registration is NOT rolled back: a late-loading panel
          // may still claim the request
          expect(storageData['pendingRequest:3']).toMatchObject({
            action: 'connect',
            requestId: expect.any(String),
          })
          // ...and a POPUP opened as a second surface, keyed by its own
          // window id ALONGSIDE the panel's key
          expect(createdWindows).toHaveLength(1)
          expect(storageData['pendingRequest:700']).toMatchObject({
            action: 'connect',
            origin: 'https://bridge.example',
            requestId: expect.any(String),
          })
          // the ORIGINAL dApp channel is still the one being answered
          expect(connect.reply.current).toBeUndefined()

          // the popup answering owns the request: the dApp is resolved and
          // BOTH surfaces' pending requests are withdrawn
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(700),
              origin: 'https://bridge.example',
              windowId: 700,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)
          expect(storageData['pendingRequest:700']).toBeUndefined()
          expect(storageData['pendingRequest:3']).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })

      // Regression for the approval-ack fix: the panel's ack must cancel the
      // 8s popup-fallback timer for ITS request only — a later request that
      // never gets an ack still opens a second-surface popup.
      it('cancels only the acked request: a later unacked request still falls back', async () => {
        jest.useFakeTimers()
        try {
          // request 1: the panel acks it after opening
          const first = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            tabDappSender,
          )
          expect(first.keptOpen).toBe(true)
          await flushMicrotasks()

          dispatch(
            { action: 'approvalDisplayed', requestId: internalIdFor(3) },
            extensionSender,
          )

          // past the 8s fallback deadline: NO popup for the acked request
          jest.advanceTimersByTime(8000)
          await flushMicrotasks()
          expect(global.chrome.windows.create).not.toHaveBeenCalled()
          expect(createdWindows).toHaveLength(0)
          // the panel still owns the request
          expect(storageData['pendingRequest:3']).toMatchObject({
            action: 'connect',
            requestId: expect.any(String),
          })

          // free the panel slot by rejecting r1 (as the approval page does)
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(3),
              origin: 'https://bridge.example',
              windowId: 3,
              result: null,
            },
            extensionSender,
          )
          expect(first.reply.current.error).toMatchObject({
            code: 'USER_REJECTED',
          })

          // request 2 from the same tab: NEVER acked
          const second = dispatch(
            { requestId: 'r2', method: 'connect', params: {} },
            tabDappSender,
          )
          expect(second.keptOpen).toBe(true)
          await flushMicrotasks()
          expect(createdWindows).toHaveLength(0)

          jest.advanceTimersByTime(8000)
          await flushMicrotasks()

          // the unacked request opened a second-surface popup
          expect(global.chrome.windows.create).toHaveBeenCalledTimes(1)
          expect(createdWindows).toHaveLength(1)
          expect(storageData['pendingRequest:700']).toMatchObject({
            action: 'connect',
            origin: 'https://bridge.example',
            requestId: expect.any(String),
          })
          // the panel registration is NOT rolled back: it was re-keyed for
          // the new request and now holds r2 until a surface claims it
          expect(storageData['pendingRequest:3']).toMatchObject({
            requestId: expect.any(String),
          })
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
          dispatch(
            { action: 'approvalDisplayed', requestId: internalIdFor(700) },
            dappSender,
          )

          jest.advanceTimersByTime(8000)
          await flushMicrotasks()

          // the forged ack was ignored: the popup fallback happened anyway
          expect(createdWindows).toHaveLength(1)
          expect(storageData['pendingRequest:700']).toMatchObject({
            requestId: expect.any(String),
          })
          // the overlap keeps the panel's registration alive (no-steal
          // model) — only an ack from a wallet page may arbitrate
          expect(storageData['pendingRequest:3']).toMatchObject({
            requestId: expect.any(String),
          })
        } finally {
          jest.useRealTimers()
        }
      })
    })

    // The no-steal overlap model: while a panel approval is pending, the
    // fallback popup opens as a SECOND surface and the first surface to
    // display (approvalDisplayed ack, carrying its own window id) or answer
    // (popupResponse) owns the request — the loser is dismissed. These
    // tests pin the arbitration contract from both sides.
    describe('overlap arbitration (panel vs second-surface popup)', () => {
      const openOverlap = async () => {
        const connect = dispatch(
          { requestId: 'r1', method: 'connect', params: {} },
          tabDappSender,
        )
        expect(connect.keptOpen).toBe(true)
        await flushMicrotasks()
        // the panel never acked: the fallback popup (window 700) opens as a
        // second surface while the panel key (pendingRequest:3) survives
        jest.advanceTimersByTime(8000)
        await flushMicrotasks()
        expect(createdWindows).toHaveLength(1)
        expect(storageData['pendingRequest:3']).toMatchObject({
          requestId: expect.any(String),
        })
        expect(storageData['pendingRequest:700']).toMatchObject({
          requestId: expect.any(String),
        })
        return connect
      }

      it('late panel ack closes the overlap popup and keeps the approval in the panel', async () => {
        jest.useFakeTimers()
        try {
          const connect = await openOverlap()

          // the panel (window 3) finally displays the request
          dispatch(
            {
              action: 'approvalDisplayed',
              requestId: internalIdFor(3),
              windowId: 3,
            },
            extensionSender,
          )
          await flushMicrotasks()

          // the overlap popup was dismissed and unregistered, but the
          // panel's key survives — the panel owns the approval now
          expect(global.chrome.windows.remove).toHaveBeenCalledWith(
            700,
            expect.any(Function),
          )
          expect(storageData['pendingRequest:700']).toBeUndefined()
          expect(storageData['pendingRequest:3']).toMatchObject({
            requestId: expect.any(String),
          })
          // the dApp is still waiting for the panel's decision
          expect(connect.reply.current).toBeUndefined()

          // answering in the panel resolves the dApp
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(3),
              origin: 'https://bridge.example',
              windowId: 3,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)
        } finally {
          jest.useRealTimers()
        }
      })

      it('popup displaying first claims the request and withdraws the panel key', async () => {
        jest.useFakeTimers()
        try {
          const connect = await openOverlap()

          // the popup (window 700) displayed the request first
          dispatch(
            {
              action: 'approvalDisplayed',
              requestId: internalIdFor(700),
              windowId: 700,
            },
            extensionSender,
          )
          await flushMicrotasks()

          // the popup became the sole owner WITHOUT being dismissed, and
          // the panel key is withdrawn so a late-loading panel cannot
          // prompt for an already-claimed request
          expect(global.chrome.windows.remove).not.toHaveBeenCalled()
          expect(storageData['pendingRequest:3']).toBeUndefined()
          expect(storageData['pendingRequest:700']).toMatchObject({
            requestId: expect.any(String),
          })

          // the popup closing without a decision cancels the dApp request —
          // no live surface is left to answer it
          for (const listener of windowRemovedListeners) listener(700)
          expect(connect.reply.current.error).toMatchObject({
            code: 'REQUEST_CANCELLED',
          })
        } finally {
          jest.useRealTimers()
        }
      })

      it('panel answering during overlap dismisses the popup', async () => {
        jest.useFakeTimers()
        try {
          const connect = await openOverlap()

          // the user answers in the PANEL while the overlap popup is open
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(3),
              origin: 'https://bridge.example',
              windowId: 3,
              result: sessionData,
            },
            extensionSender,
          )
          await flushMicrotasks()

          // the decision reaches the dApp and the losing popup surface is
          // dismissed with its pending key withdrawn
          expect(connect.reply.current.result).toEqual(sessionData)
          expect(global.chrome.windows.remove).toHaveBeenCalledWith(
            700,
            expect.any(Function),
          )
          expect(storageData['pendingRequest:700']).toBeUndefined()
          expect(storageData['pendingRequest:3']).toBeUndefined()
        } finally {
          jest.useRealTimers()
        }
      })
    })

    // Regression for the same-window key clobber: panel requests are keyed
    // by the dApp tab's WINDOW id and connect vs signing run in SEPARATE
    // slots — two requests from two tabs of one window used to both pass
    // their own slot's busy guard, and the second storage write under
    // `pendingRequest:<windowId>` overwrote the first approval's record.
    // The first dApp's promise hung until its timeout and its slot stayed
    // busy until the worker restarts. One pending approval per window now:
    // the second request is refused with the same structured code the
    // same-slot busy guard already answers, the pending record survives,
    // and the window frees up as soon as the first approval is answered.
    describe('one pending approval per window (cross-slot clobber)', () => {
      const grantedSender = {
        ...tabDappSender,
        origin: 'https://shop.example',
        url: 'https://shop.example/page',
      }
      const otherTabSameWindow = {
        id: 'other-site',
        origin: 'https://other.example',
        url: 'https://other.example/page',
        tab: { id: 6, windowId: 3 },
      }

      const grantShopOrigin = async () => {
        dispatch(
          { requestId: 'pre', method: 'connect', params: {} },
          grantedSender,
        )
        await flushMicrotasks()
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: internalIdFor(3),
            origin: 'https://shop.example',
            windowId: 3,
            result: sessionData,
          },
          extensionSender,
        )
        expect(
          storageData['connectedSites']['https://shop.example'],
        ).toBeTruthy()
      }

      // Grants the OTHER origin through its own approval flow in a DIFFERENT
      // window (9) — a mid-test storage write would not reach the worker's
      // in-memory map, and window 3 must stay free for the tests below.
      const grantOtherOrigin = async () => {
        dispatch(
          { requestId: 'pre2', method: 'connect', params: {} },
          { ...otherTabSameWindow, tab: { id: 7, windowId: 9 } },
        )
        await flushMicrotasks()
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: internalIdFor(9),
            origin: 'https://other.example',
            windowId: 9,
            result: sessionData,
          },
          extensionSender,
        )
        expect(
          storageData['connectedSites']['https://other.example'],
        ).toBeTruthy()
      }

      it('refuses a same-window second approval instead of clobbering the pending record, and frees the window when it answers', async () => {
        await grantShopOrigin()

        // the granted origin opens a SIGNING approval in window 3 (panel)
        const sign = dispatch(
          {
            requestId: 's1',
            method: 'signTransaction',
            params: { txData: { JSONRepresentation: {} } },
          },
          grantedSender,
        )
        await flushMicrotasks()
        expect(sign.keptOpen).toBe(true)
        const signId = storageData['pendingRequest:3']?.requestId
        expect(signId).toBeTruthy()

        // another tab of the SAME window asks for a connect approval while
        // the signing approval is pending
        const connect = dispatch(
          { requestId: 'c1', method: 'connect', params: {} },
          otherTabSameWindow,
        )

        // refused immediately with the same structured code the same-slot
        // busy guard answers — the dApp is never left hanging
        expect(connect.reply.current).toMatchObject({
          error: { code: 'REQUEST_IN_PROGRESS' },
        })
        expect(connect.keptOpen).toBe(false)
        // no approval window was opened for the refused request
        expect(createdWindows).toHaveLength(0)
        // the signing record was NOT overwritten
        expect(storageData['pendingRequest:3']?.requestId).toBe(signId)

        // the pending request resolves CORRECTLY: the answer lands on the
        // signing channel it was opened for
        dispatch(
          {
            action: 'popupResponse',
            method: 'signTransaction_approve',
            requestId: signId,
            origin: 'https://shop.example',
            windowId: 3,
            result: { signedTxHex: 'deadbeef' },
          },
          extensionSender,
        )
        expect(sign.reply.current).toMatchObject({
          result: { signedTxHex: 'deadbeef' },
        })
        expect(storageData['pendingRequest:3']).toBeUndefined()

        // the window is free again: the refused connect can now proceed
        // (no slot wedge) and opens its own panel approval
        const retry = dispatch(
          { requestId: 'c2', method: 'connect', params: {} },
          otherTabSameWindow,
        )
        expect(retry.keptOpen).toBe(true)
        await flushMicrotasks()
        expect(storageData['pendingRequest:3']).toMatchObject({
          action: 'connect',
          origin: 'https://other.example',
          requestId: expect.any(String),
        })
        const retryId = storageData['pendingRequest:3']?.requestId

        // answer the retried connect too: an unanswered panel approval would
        // leave its 8s popup-fallback timer live under real timers, and the
        // stale closure could mutate later fixtures
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: retryId,
            origin: 'https://other.example',
            windowId: 3,
            result: sessionData,
          },
          extensionSender,
        )
        expect(retry.reply.current.result).toEqual(sessionData)
        expect(storageData['pendingRequest:3']).toBeUndefined()
      })

      it('both a connect and a sign request for the same window eventually resolve', async () => {
        await grantShopOrigin()

        // signing approval pending in window 3
        const sign = dispatch(
          {
            requestId: 's1',
            method: 'signTransaction',
            params: { txData: { JSONRepresentation: {} } },
          },
          grantedSender,
        )
        await flushMicrotasks()
        const signId = storageData['pendingRequest:3']?.requestId

        // the same window's connect request is refused while the signing
        // approval is pending (its promise settles — with the busy error —
        // instead of hanging)
        const connect = dispatch(
          { requestId: 'c1', method: 'connect', params: {} },
          otherTabSameWindow,
        )
        expect(connect.reply.current).toMatchObject({
          error: { code: 'REQUEST_IN_PROGRESS' },
        })
        expect(storageData['pendingRequest:3']?.requestId).toBe(signId)

        // the signing approval answers first…
        dispatch(
          {
            action: 'popupResponse',
            method: 'signTransaction_approve',
            requestId: signId,
            origin: 'https://shop.example',
            windowId: 3,
            result: { signedTxHex: 'feedface' },
          },
          extensionSender,
        )
        expect(sign.reply.current).toMatchObject({
          result: { signedTxHex: 'feedface' },
        })

        // …and the connect request, retried once the window is free,
        // resolves with its own approval and grant
        const retry = dispatch(
          { requestId: 'c2', method: 'connect', params: {} },
          otherTabSameWindow,
        )
        expect(retry.keptOpen).toBe(true)
        await flushMicrotasks()
        const retryId = storageData['pendingRequest:3']?.requestId
        expect(retryId).toBeTruthy()
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: retryId,
            origin: 'https://other.example',
            windowId: 3,
            result: sessionData,
          },
          extensionSender,
        )
        expect(retry.reply.current.result).toEqual(sessionData)
        expect(
          storageData['connectedSites']['https://other.example'],
        ).toBeTruthy()
      })

      // The predicate is symmetric: the same-window refusal must also hold
      // when the CONNECT slot owns the window and a signing request arrives.
      it('refuses a signTransaction while a connect approval is pending in the same window', async () => {
        await grantOtherOrigin()

        // shop.example has NO grant yet: its connect reaches the approval
        // path and opens a panel approval in window 3
        const connect = dispatch(
          { requestId: 'c1', method: 'connect', params: {} },
          grantedSender,
        )
        await flushMicrotasks()
        expect(connect.keptOpen).toBe(true)
        const connectId = storageData['pendingRequest:3']?.requestId
        expect(connectId).toBeTruthy()

        // another tab of the SAME window (its origin IS granted) asks for a
        // signing approval while the connect approval is pending
        const sign = dispatch(
          {
            requestId: 's1',
            method: 'signTransaction',
            params: { txData: { JSONRepresentation: {} } },
          },
          otherTabSameWindow,
        )

        // refused with the same structured code; the connect record was NOT
        // overwritten and no approval window was opened
        expect(sign.reply.current).toMatchObject({
          error: { code: 'REQUEST_IN_PROGRESS' },
        })
        expect(sign.keptOpen).toBe(false)
        expect(createdWindows).toHaveLength(0)
        expect(storageData['pendingRequest:3']?.requestId).toBe(connectId)

        // the pending connect resolves CORRECTLY and frees the window
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: connectId,
            origin: 'https://shop.example',
            windowId: 3,
            result: sessionData,
          },
          extensionSender,
        )
        expect(connect.reply.current.result).toEqual(sessionData)
        expect(storageData['pendingRequest:3']).toBeUndefined()

        // the window is free again: the refused sign can now proceed
        // (no slot wedge)
        const retry = dispatch(
          {
            requestId: 's2',
            method: 'signTransaction',
            params: { txData: { JSONRepresentation: {} } },
          },
          otherTabSameWindow,
        )
        expect(retry.keptOpen).toBe(true)
        await flushMicrotasks()
        const retryId = storageData['pendingRequest:3']?.requestId
        expect(retryId).toBeTruthy()

        // answer the retried sign too so no popup-fallback timer outlives
        // the test under real timers
        dispatch(
          {
            action: 'popupResponse',
            method: 'signTransaction_approve',
            requestId: retryId,
            origin: 'https://other.example',
            windowId: 3,
            result: { signedTxHex: 'cafebabe' },
          },
          extensionSender,
        )
        expect(retry.reply.current).toMatchObject({
          result: { signedTxHex: 'cafebabe' },
        })
        expect(storageData['pendingRequest:3']).toBeUndefined()
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
          requestId: internalIdFor(700),
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
        requestId: expect.any(String),
      })
    })
  })

  // ── lock/logout revocation (walletLocked) ──
  // The revocation contract promises that wallet lock/logout revokes every
  // grant, but the lock state lives in the wallet pages' localStorage —
  // unreadable from the worker. AccountProvider announces both lifecycle
  // events (manual logout and the 30-minute auto-lock expiry) with the
  // `walletLocked` action; the worker must then revoke ALL grants with the
  // same propagation as disconnectSite: durable deletion + tab broadcast.
  describe('lock/logout revocation (walletLocked)', () => {
    const otherDappSender = {
      id: 'some-site',
      origin: 'https://other.example',
      url: 'https://other.example/page',
    }

    const connectOrigin = (sender, requestId) => {
      dispatch({ requestId, method: 'connect', params: {} }, sender)
      // the approval is keyed by the window the connect opened for it
      const windowId = createdWindows[createdWindows.length - 1].id
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: internalIdFor(windowId),
          origin: sender.origin,
          windowId,
          result: sessionData,
        },
        extensionSender,
      )
    }

    it('revokes every grant and broadcasts MOJITO_SESSION_REVOKED for each origin', () => {
      connectOrigin(dappSender, 'r1')
      connectOrigin(otherDappSender, 'r2')
      expect(Object.keys(storageData.connectedSites)).toHaveLength(2)

      const { reply } = dispatch({ action: 'walletLocked' }, extensionSender)

      expect(reply.current.result).toEqual({ revoked: 2 })
      // durably gone, not just dropped from memory
      expect(storageData.connectedSites).toEqual({})
      // every tab is notified for EVERY revoked origin, so no page keeps
      // acting on a dead grant after the user locked the wallet
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(4)
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
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://other.example' },
        expect.any(Function),
      )
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        2,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://other.example' },
        expect.any(Function),
      )
    })

    it('a locked wallet stops answering the dApp: checkConnection/getSession refuse and connect needs a fresh approval', () => {
      connectOrigin(dappSender, 'r1')
      dispatch({ action: 'walletLocked' }, extensionSender)
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalled()
      global.chrome.tabs.sendMessage.mockClear()

      const check = dispatch(
        { requestId: 'c1', method: 'checkConnection', params: {} },
        dappSender,
      )
      expect(check.reply.current).toEqual({
        result: { isConnected: false },
      })

      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current).toEqual({ result: null })

      // and a reconnect is NOT shortcut by the revoked grant: a fresh
      // approval flow opens instead
      global.chrome.tabs.sendMessage.mockClear()
      const reconnect = dispatch(
        { requestId: 'r3', method: 'connect', params: {} },
        dappSender,
      )
      expect(reconnect.reply.current).toBeUndefined()
      expect(reconnect.keptOpen).toBe(true)
      expect(createdWindows).toHaveLength(2)
      expect(storageData['pendingRequest:701']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
      })
      // no revocation broadcast can be forged this way either
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('ignores walletLocked forged from a web page sender (extension-page gate)', () => {
      connectOrigin(dappSender, 'r1')

      const forged = dispatch({ action: 'walletLocked' }, dappSender)

      // no answer, no revocation, no broadcast: a website must never be
      // able to revoke other sites' grants
      expect(forged.reply.current).toBeUndefined()
      expect(forged.keptOpen).toBe(false)
      expect(storageData.connectedSites['https://bridge.example']).toBeDefined()
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('answers revoked: 0 with no broadcast when nothing is connected', () => {
      const { reply } = dispatch({ action: 'walletLocked' }, extensionSender)

      expect(reply.current.result).toEqual({ revoked: 0 })
      expect(global.chrome.tabs.query).not.toHaveBeenCalled()
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('answers failure only after the retried persist also fails', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        let setCalls = 0
        global.chrome.storage.local.set = (obj, cb) => {
          setCalls += 1
          Object.assign(storageData, JSON.parse(JSON.stringify(obj)))
          global.chrome.runtime.lastError = { message: 'quota exceeded' }
          cb()
          delete global.chrome.runtime.lastError
        }

        const { reply } = dispatch({ action: 'walletLocked' }, extensionSender)

        // first attempt failed: the answer waits for the retried write
        expect(reply.current).toBeUndefined()
        jest.advanceTimersByTime(250)
        global.chrome.storage.local.set = originalSet

        // failed persistence must NOT be answered with success and must not
        // claim revocation to the sites' tabs
        expect(setCalls).toBe(2)
        expect(reply.current.error).toBe('quota exceeded')
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('a retried persist that succeeds still revokes and broadcasts', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        let setCalls = 0
        global.chrome.storage.local.set = (obj, cb) => {
          setCalls += 1
          Object.assign(storageData, JSON.parse(JSON.stringify(obj)))
          if (setCalls === 1) {
            global.chrome.runtime.lastError = { message: 'quota exceeded' }
          }
          cb()
          delete global.chrome.runtime.lastError
        }

        const { reply } = dispatch({ action: 'walletLocked' }, extensionSender)
        jest.advanceTimersByTime(250)
        global.chrome.storage.local.set = originalSet

        expect(setCalls).toBe(2)
        expect(reply.current.result).toEqual({ revoked: 1 })
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
      } finally {
        jest.useRealTimers()
      }
    })

    it('a re-send after total persist failure re-attempts against storage (success is never faked)', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        // both write attempts fail WITHOUT landing: storage keeps the grant,
        // the memory map is emptied — exactly the state a lost revocation
        // leaves behind
        global.chrome.storage.local.set = (obj, cb) => {
          global.chrome.runtime.lastError = { message: 'quota exceeded' }
          cb()
          delete global.chrome.runtime.lastError
        }

        const first = dispatch({ action: 'walletLocked' }, extensionSender)
        jest.advanceTimersByTime(250)
        expect(first.reply.current.error).toBe('quota exceeded')
        // durable snapshot still holds the grant; the memory map does not
        expect(
          storageData.connectedSites['https://bridge.example'],
        ).toBeDefined()

        // worker recovers; the wallet re-sends (its reply was an error)
        global.chrome.storage.local.set = originalSet
        const second = dispatch({ action: 'walletLocked' }, extensionSender)

        // NOT {revoked: 0}: the re-send re-attempted persistence against the
        // durable snapshot and actually deleted the grants
        expect(second.reply.current).toEqual({ result: { revoked: 1 } })
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
      } finally {
        jest.useRealTimers()
      }
    })

    it('a re-send answers the error when the durable re-read itself fails', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        global.chrome.storage.local.set = (obj, cb) => {
          global.chrome.runtime.lastError = { message: 'quota exceeded' }
          cb()
          delete global.chrome.runtime.lastError
        }
        const first = dispatch({ action: 'walletLocked' }, extensionSender)
        jest.advanceTimersByTime(250)
        expect(first.reply.current.error).toBe('quota exceeded')
        global.chrome.storage.local.set = originalSet

        const originalGet = global.chrome.storage.local.get
        global.chrome.storage.local.get = (keys, cb) => {
          if (
            Array.isArray(keys) &&
            keys.length === 1 &&
            keys[0] === 'connectedSites'
          ) {
            // the re-read that would recover the durable snapshot fails too
            global.chrome.runtime.lastError = { message: 'storage unavailable' }
            cb({})
            delete global.chrome.runtime.lastError
            return
          }
          originalGet(keys, cb)
        }

        const second = dispatch({ action: 'walletLocked' }, extensionSender)
        global.chrome.storage.local.get = originalGet

        expect(second.reply.current.error).toBe('storage unavailable')
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('a re-send clears the pending flag when the durable snapshot self-healed', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        global.chrome.storage.local.set = (obj, cb) => {
          // fails WITHOUT landing; the durable copy is removed below by
          // another writer (e.g. a network sweep persisting the same removal)
          global.chrome.runtime.lastError = { message: 'quota exceeded' }
          cb()
          delete global.chrome.runtime.lastError
        }
        const first = dispatch({ action: 'walletLocked' }, extensionSender)
        jest.advanceTimersByTime(250)
        expect(first.reply.current.error).toBe('quota exceeded')
        global.chrome.storage.local.set = originalSet

        delete storageData.connectedSites

        const second = dispatch({ action: 'walletLocked' }, extensionSender)
        expect(second.reply.current).toEqual({ result: { revoked: 0 } })
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
    })

    it('a re-send does not clobber a grant approved while the durable re-read was in flight', () => {
      jest.useFakeTimers()
      try {
        connectOrigin(dappSender, 'r1')
        const originalSet = global.chrome.storage.local.set
        global.chrome.storage.local.set = (obj, cb) => {
          global.chrome.runtime.lastError = { message: 'quota exceeded' }
          cb()
          delete global.chrome.runtime.lastError
        }
        const first = dispatch({ action: 'walletLocked' }, extensionSender)
        jest.advanceTimersByTime(250)
        expect(first.reply.current.error).toBe('quota exceeded')
        global.chrome.storage.local.set = originalSet

        // defer the durable re-read: while it is in flight, a SECOND site
        // completes a fresh connect approval (its grant lands in storage)
        let resolveReRead
        const realGet = global.chrome.storage.local.get
        global.chrome.storage.local.get = (keys, cb) => {
          if (
            Array.isArray(keys) &&
            keys.length === 1 &&
            keys[0] === 'connectedSites'
          ) {
            resolveReRead = () =>
              cb({
                connectedSites: {
                  // the STALE durable snapshot: only the pre-lock grant
                  'https://bridge.example': { ...sessionData, timestamp: 1 },
                },
              })
            return
          }
          realGet(keys, cb)
        }
        const second = dispatch({ action: 'walletLocked' }, extensionSender)
        expect(second.reply.current).toBeUndefined()

        const freshSender = {
          id: 'some-site',
          origin: 'https://fresh.example',
          url: 'https://fresh.example/page',
        }
        dispatch(
          { requestId: 'r2', method: 'connect', params: {} },
          freshSender,
        )
        const freshWindowId = createdWindows.at(-1).id
        dispatch(
          {
            action: 'popupResponse',
            method: 'connect',
            requestId: internalIdFor(freshWindowId),
            origin: 'https://fresh.example',
            windowId: freshWindowId,
            result: sessionData,
          },
          extensionSender,
        )
        expect(
          storageData.connectedSites['https://fresh.example'],
        ).toBeDefined()

        // the stale snapshot lands: the re-send must revoke the stale origin
        // and persist the whole CURRENT map — the newer grant survives
        // (rehydrating the snapshot used to erase it from memory AND storage)
        resolveReRead()

        expect(second.reply.current).toEqual({ result: { revoked: 1 } })
        expect(
          storageData.connectedSites['https://fresh.example'],
        ).toBeDefined()
        expect(
          storageData.connectedSites['https://bridge.example'],
        ).toBeUndefined()
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
      } finally {
        jest.useRealTimers()
      }
    })
  })

  // ── lock-mirror sweep (auto-lock with no wallet page open) ──
  // The 30-minute auto-lock previously fired only when a LIVE wallet page
  // re-checked its registry: with no page open, persisted grants kept
  // answering checkConnection/getSession indefinitely — across worker AND
  // browser restarts. The wallet now mirrors its lock clock to
  // chrome.storage.local ('walletLockAt', stamped at every registry write:
  // unlock, throttled activity refresh, pagehide, logout — never null while
  // a session is live), and the worker sweeps grants whenever it observes
  // an expired mirror: at boot, on the storage write, and on any inbound
  // message.
  describe('lock-mirror sweep (auto-lock with no wallet page open)', () => {
    const expiredMirror = () => Date.now() - 31 * 60 * 1000
    const freshMirror = () => Date.now() - 5 * 60 * 1000

    const connectAndApprove = () => {
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: internalIdFor(700),
          origin: 'https://bridge.example',
          windowId: 700,
          result: sessionData,
        },
        extensionSender,
      )
    }

    // boots a fresh worker on top of pre-seeded storage (the boot snapshot
    // path: mirror + epoch + grants land while the worker was dead)
    const bootWithMirror = (
      walletLockAt,
      sites = {},
      grantsRevokedAt = null,
    ) => {
      messageListeners.length = 0
      storageChangeListeners.length = 0
      windowRemovedListeners.length = 0
      createdWindows.length = 0
      global.chrome.tabs.query.mockClear()
      global.chrome.tabs.sendMessage.mockClear()
      storageData.networkType = 'testnet'
      storageData.connectedSites = sites
      if (walletLockAt == null) delete storageData.walletLockAt
      else storageData.walletLockAt = walletLockAt
      if (grantsRevokedAt == null) delete storageData.grantsRevokedAt
      else storageData.grantsRevokedAt = grantsRevokedAt
      loadBackground()
    }

    // Boots a worker whose boot get is held open: the callback only lands
    // when the test resolves it, so a live mirror write can interleave —
    // the exact interleaving the adoption guard must survive. `sites` seeds
    // the persisted grants (the stale snapshot typically mirrors them).
    const bootWithDeferredSnapshot = (staleSnapshot, sites = {}) => {
      let resolveBootGet
      const realGet = global.chrome.storage.local.get
      global.chrome.storage.local.get = (keys, cb) => {
        // defer ONLY the boot read (its key trio is unique to the boot)
        if (Array.isArray(keys) && keys.includes('walletLockAt')) {
          resolveBootGet = () => cb(staleSnapshot)
          return
        }
        realGet(keys, cb)
      }
      bootWithMirror(null, sites)
      global.chrome.storage.local.get = realGet
      return resolveBootGet
    }

    // The boot read and a live mirror write can interleave: storage.onChanged
    // adopts a write while the boot get is still in flight, then the boot
    // callback lands with the OLDER snapshot. The snapshot must never revert
    // the adopted value: a stale null would lose the pagehide stamp for this
    // worker's lifetime (grants answer a locked wallet until restart), and a
    // stale expired value would false-sweep an unlocked wallet's live grants
    // at boot.
    it('a boot snapshot landing after an adopted stamp cannot revert it to null', () => {
      jest.useFakeTimers()
      try {
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        const grant = {
          'https://bridge.example': { ...sessionData, timestamp: 1 },
        }
        const resolveBootGet = bootWithDeferredSnapshot(
          {
            connectedSites: grant, // OLDER snapshot: read before the stamp
            networkType: 'testnet',
            walletLockAt: null,
          },
          grant,
        )

        // the pagehide stamp lands live while the boot get is in flight
        const stampedAt = Date.now() - 5 * 60 * 1000
        storageData.walletLockAt = stampedAt
        for (const listener of storageChangeListeners) {
          listener({ walletLockAt: { newValue: stampedAt } }, 'local')
        }
        // fresh mirror: nothing swept yet
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()

        // 36 minutes pass with no wallet page open; then the stale (null)
        // snapshot lands
        jest.setSystemTime(new Date('2026-01-01T00:36:00Z'))
        resolveBootGet()

        // the ADOPTED stamp survives boot — it is expired by now, so the
        // grants are swept exactly as if no boot read had been in flight
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        const check = dispatch(
          { requestId: 'c1', method: 'checkConnection', params: {} },
          dappSender,
        )
        expect(check.reply.current).toEqual({ result: { isConnected: false } })
      } finally {
        jest.useRealTimers()
      }
    })

    it('a boot snapshot landing after an adopted clear cannot false-sweep an unlocked wallet', () => {
      const grant = {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      }
      const resolveBootGet = bootWithDeferredSnapshot(
        {
          connectedSites: grant, // OLDER snapshot: mirror stamped before the unlock
          networkType: 'testnet',
          walletLockAt: Date.now() - 40 * 60 * 1000,
        },
        grant,
      )

      // a legacy/pre-fix writer clears the mirror (the UI now stamps a
      // NUMBER everywhere, but the worker must still adopt a null
      // defensively) while the boot get is in flight
      for (const listener of storageChangeListeners) {
        listener({ walletLockAt: { newValue: null } }, 'local')
      }
      // adopted clear: nothing swept so far
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()

      // then the stale (already-expired) snapshot lands
      resolveBootGet()

      // the adopted clear wins: the live grant keeps answering, no sweep
      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current.result).toMatchObject({
        network: 'testnet',
      })
      expect(storageData.connectedSites).toEqual(grant)
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('a worker that boots with an expired lock mirror sweeps the grants', () => {
      bootWithMirror(expiredMirror(), {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      })

      // durably gone before any queued message could be answered
      expect(storageData.connectedSites).toEqual({})
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
    })

    it('a fresh (unexpired) lock mirror never sweeps at boot', () => {
      bootWithMirror(freshMirror(), {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      })

      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current.result).toMatchObject({
        network: 'testnet',
      })
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('no mirror at all never sweeps (wallet unlocked or never locked)', () => {
      bootWithMirror(null, {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      })

      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current.result).toMatchObject({
        network: 'testnet',
      })
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('a hard-killed session ages its unlock stamp into a boot sweep (no pagehide ever fired)', () => {
      // The scenario: unlock stamped the mirror with the fresh
      // registry clock, then the browser was killed without any pagehide
      // (crash/OOM/power loss) — hours later the worker restarts with the
      // grant still persisted and the aged stamp as the only witness.
      bootWithMirror(Date.now() - 2 * 60 * 60 * 1000, {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      })

      // swept durably before any queued message could be answered
      expect(storageData.connectedSites).toEqual({})
      const check = dispatch(
        { requestId: 'c1', method: 'checkConnection', params: {} },
        dappSender,
      )
      expect(check.reply.current).toEqual({ result: { isConnected: false } })
    })

    it('a mirror an active session keeps ≤60s stale never false-sweeps (boot + message path)', () => {
      // What an actively used session leaves behind: every throttled
      // activity persist re-stamps the mirror, so the worst case staleness
      // is one persist interval (ACTIVITY_PERSIST_INTERVAL_MS = 60s).
      bootWithMirror(Date.now() - 55 * 1000, {
        'https://bridge.example': { ...sessionData, timestamp: 1 },
      })

      // no sweep at boot — the grant still answers
      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current.result).toMatchObject({
        network: 'testnet',
      })

      // and no piggyback sweep on the message path either
      const check = dispatch(
        { requestId: 'c1', method: 'checkConnection', params: {} },
        dappSender,
      )
      expect(check.reply.current).toEqual({ result: { isConnected: true } })
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('a live worker sweeps when onChanged lands an expired lock mirror', () => {
      bootWithMirror(null)
      connectAndApprove()
      expect(Object.keys(storageData.connectedSites)).toHaveLength(1)

      const stale = expiredMirror()
      storageData.walletLockAt = stale
      for (const listener of storageChangeListeners) {
        listener({ walletLockAt: { newValue: stale } }, 'local')
      }

      expect(storageData.connectedSites).toEqual({})
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )
    })

    it('a fresh mirror landing through onChanged does not sweep', () => {
      bootWithMirror(null)
      connectAndApprove()

      const fresh = freshMirror()
      storageData.walletLockAt = fresh
      for (const listener of storageChangeListeners) {
        listener({ walletLockAt: { newValue: fresh } }, 'local')
      }

      const session = dispatch(
        { requestId: 'g1', method: 'getSession', params: {} },
        dappSender,
      )
      expect(session.reply.current.result).toMatchObject({
        network: 'testnet',
      })
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
    })

    it('a live worker sweeps an expiry observed on the message path (piggyback)', () => {
      jest.useFakeTimers()
      try {
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
        bootWithMirror(Date.now() - 5 * 60 * 1000, {
          'https://bridge.example': { ...sessionData, timestamp: 1 },
        })

        // still fresh: the session answers normally
        const before = dispatch(
          { requestId: 'g1', method: 'getSession', params: {} },
          dappSender,
        )
        expect(before.reply.current.result).toMatchObject({
          network: 'testnet',
        })

        // 31 minutes pass with no wallet page open; the next message is
        // exactly the moment a stale grant could be used
        jest.setSystemTime(new Date('2026-01-01T00:31:00Z'))
        const check = dispatch(
          { requestId: 'c1', method: 'checkConnection', params: {} },
          dappSender,
        )

        expect(check.reply.current).toEqual({ result: { isConnected: false } })
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
      } finally {
        jest.useRealTimers()
      }
    })

    // ── revocation epoch ('grantsRevokedAt') ──
    // The lock mirror is re-stamped FRESH by every unlock — which in the
    // lost-notify case (both walletLocked sends fail, the worker stays dead)
    // erases the logout's already-expired stamp before the worker ever
    // observes it: the worker then boots with a fresh mirror and the durable
    // pre-logout grants, answering the session the logout destroyed for a
    // whole fresh mirror TTL. Every lock therefore ALSO stamps a monotonic
    // revocation epoch ('grantsRevokedAt') the unlock never touches, and the
    // sweep (the same boot/write/piggyback paths as the mirror) deletes every
    // grant approved at or before it: grant timestamps are set at approval
    // time, so grants approved after the re-unlock legitimately survive, and
    // absent epoch (legacy storage) means no epoch-based deletion at all —
    // the mirror-expiry path keeps its pre-existing behavior.
    describe('revocation epoch (grantsRevokedAt survives unlock re-stamps)', () => {
      const epochAfterLogout = () => Date.now() - 10 * 60 * 1000
      const freshUnlockMirror = () => Date.now() - 5 * 60 * 1000

      const landEpochWrite = (revokedAt) => {
        storageData.grantsRevokedAt = revokedAt
        for (const listener of storageChangeListeners) {
          listener({ grantsRevokedAt: { newValue: revokedAt } }, 'local')
        }
      }

      const landMirrorWrite = (stampedAt) => {
        storageData.walletLockAt = stampedAt
        for (const listener of storageChangeListeners) {
          listener({ walletLockAt: { newValue: stampedAt } }, 'local')
        }
      }

      it('a lost-notify logout survives the re-unlock re-stamp: pre-logout grants swept at boot', () => {
        // Timeline: grant approved 2h ago → logout 10 min ago stamped the
        // epoch and an already-expired mirror, both walletLocked sends failed
        // → re-unlock 5 min ago re-stamped the mirror FRESH (erasing the
        // expired witness) → the worker only now wakes via an open dApp
        // tab's checkConnection poll.
        bootWithMirror(
          freshUnlockMirror(),
          {
            'https://bridge.example': {
              ...sessionData,
              timestamp: Date.now() - 2 * 60 * 60 * 1000,
            },
          },
          epochAfterLogout(),
        )

        // the epoch swept the pre-logout grant durably before any message
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        const check = dispatch({ method: 'checkConnection' }, dappSender)
        expect(check.reply.current).toEqual({ result: { isConnected: false } })
      })

      it('a grant approved after the re-unlock (timestamp > epoch) survives the boot sweep', () => {
        bootWithMirror(
          freshUnlockMirror(),
          {
            'https://bridge.example': {
              ...sessionData,
              timestamp: Date.now() - 60 * 1000,
            },
          },
          epochAfterLogout(),
        )

        const session = dispatch({ method: 'getSession' }, dappSender)
        expect(session.reply.current.result).toMatchObject({
          network: 'testnet',
        })
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
      })

      it('only pre-epoch grants are swept when pre- and post-unlock grants coexist', () => {
        bootWithMirror(
          freshUnlockMirror(),
          {
            'https://bridge.example': {
              ...sessionData,
              timestamp: Date.now() - 2 * 60 * 60 * 1000,
            },
            'https://other.example': {
              ...sessionData,
              timestamp: Date.now() - 60 * 1000,
            },
          },
          epochAfterLogout(),
        )

        // exactly the pre-logout grant is gone, durably and for its tabs
        expect(storageData.connectedSites).toEqual({
          'https://other.example': expect.objectContaining({
            network: 'testnet',
          }),
        })
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://other.example' },
          expect.any(Function),
        )
      })

      it('a later sweep completes an epoch deletion whose persist failed twice (durable re-read)', () => {
        // The sweep emptied the in-memory map but both storage writes failed
        // while the worker lived: revocationPending stays set and the
        // pre-epoch grant lingers in the durable snapshot. The NEXT sweep
        // (here: the message-path piggyback) must re-read that snapshot and
        // finish the deletion — not answer from the empty in-memory map.
        jest.useFakeTimers()
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
          bootWithMirror(null)
          const connect = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            dappSender,
          )
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(700),
              origin: 'https://bridge.example',
              windowId: 700,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)

          // logout at +1min stamps the epoch; the sweep's persist fails
          // twice WITHOUT landing (the retry backoff runs on fake timers)
          jest.setSystemTime(new Date('2026-01-01T00:01:00Z'))
          const originalSet = global.chrome.storage.local.set
          global.chrome.storage.local.set = (obj, cb) => {
            global.chrome.runtime.lastError = { message: 'quota exceeded' }
            cb()
            delete global.chrome.runtime.lastError
          }
          landEpochWrite(Date.now())
          jest.advanceTimersByTime(250)
          expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
          // exactly the lost-revocation state: memory empty, durable copy
          // still holding the grant
          expect(
            storageData.connectedSites['https://bridge.example'],
          ).toBeDefined()

          // worker recovers; the next piggyback sweep self-heals against
          // the durable snapshot
          global.chrome.storage.local.set = originalSet
          const check = dispatch({ method: 'checkConnection' }, dappSender)
          expect(check.reply.current).toEqual({
            result: { isConnected: false },
          })
          expect(storageData.connectedSites).toEqual({})
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            1,
            {
              type: 'MOJITO_SESSION_REVOKED',
              origin: 'https://bridge.example',
            },
            expect.any(Function),
          )
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2)
        } finally {
          jest.useRealTimers()
        }
      })

      it('the epoch self-heal re-read revokes only pre-epoch durable grants', () => {
        // The durable re-read must NOT become a whole-map revoke: a
        // post-epoch grant that also sits in storage (its own persist may
        // have landed while the sweep's write kept failing) legitimately
        // survives — routing through revokeAllGrants wholesale would
        // delete it.
        jest.useFakeTimers()
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
          const originalSet = global.chrome.storage.local.set
          global.chrome.storage.local.set = (obj, cb) => {
            global.chrome.runtime.lastError = { message: 'quota exceeded' }
            cb()
            delete global.chrome.runtime.lastError
          }
          bootWithMirror(
            freshUnlockMirror(),
            {
              'https://bridge.example': {
                ...sessionData,
                timestamp: Date.now() - 2 * 60 * 60 * 1000,
              },
              'https://other.example': {
                ...sessionData,
                timestamp: Date.now() - 60 * 1000,
              },
            },
            epochAfterLogout(),
          )
          jest.advanceTimersByTime(250)

          // the boot sweep failed to persist: both grants are still durable,
          // only the pre-epoch one is gone from memory
          expect(
            storageData.connectedSites['https://bridge.example'],
          ).toBeDefined()
          expect(
            storageData.connectedSites['https://other.example'],
          ).toBeDefined()

          global.chrome.storage.local.set = originalSet
          const check = dispatch({ method: 'checkConnection' }, dappSender)
          expect(check.reply.current).toEqual({
            result: { isConnected: false },
          })

          // only the pre-epoch grant was revoked, durably and for its tabs;
          // the post-epoch grant keeps answering
          expect(storageData.connectedSites).toEqual({
            'https://other.example': expect.objectContaining({
              network: 'testnet',
            }),
          })
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            1,
            {
              type: 'MOJITO_SESSION_REVOKED',
              origin: 'https://bridge.example',
            },
            expect.any(Function),
          )
          expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
            1,
            {
              type: 'MOJITO_SESSION_REVOKED',
              origin: 'https://other.example',
            },
            expect.any(Function),
          )
          const other = dispatch(
            { method: 'checkConnection' },
            {
              id: 'some-site',
              origin: 'https://other.example',
              url: 'https://other.example/page',
            },
          )
          expect(other.reply.current).toEqual({
            result: { isConnected: true },
          })
        } finally {
          jest.useRealTimers()
        }
      })

      it('a live worker sweeps the moment the logout epoch lands via onChanged (lost notify)', () => {
        // Fake timers make every step's clock deterministic: the re-approval
        // must land STRICTLY after the epoch (a same-millisecond approval
        // compares equal and fails closed in production — never in a test).
        jest.useFakeTimers()
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
          bootWithMirror(null)
          const connect = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            dappSender,
          )
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(700),
              origin: 'https://bridge.example',
              windowId: 700,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)
          expect(Object.keys(storageData.connectedSites)).toHaveLength(1)

          // logout at +1min stamps the epoch but both walletLocked sends
          // fail: only the durable write lands, and the worker sweeps the
          // grant the moment it observes it
          jest.setSystemTime(new Date('2026-01-01T00:01:00Z'))
          landEpochWrite(Date.now())

          expect(storageData.connectedSites).toEqual({})
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            1,
            {
              type: 'MOJITO_SESSION_REVOKED',
              origin: 'https://bridge.example',
            },
            expect.any(Function),
          )
          const check = dispatch({ method: 'checkConnection' }, dappSender)
          expect(check.reply.current).toEqual({
            result: { isConnected: false },
          })

          // the re-unlock at +2min re-stamps the mirror fresh; the epoch
          // stays put and must not sweep anything on its own — a NEW
          // approval at +3min (timestamp > epoch) connects and answers
          jest.setSystemTime(new Date('2026-01-01T00:02:00Z'))
          landMirrorWrite(Date.now())
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2) // no new revocations

          jest.setSystemTime(new Date('2026-01-01T00:03:00Z'))
          const reconnect = dispatch(
            { requestId: 'r2', method: 'connect', params: {} },
            dappSender,
          )
          expect(reconnect.keptOpen).toBe(true)
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(701),
              origin: 'https://bridge.example',
              windowId: 701,
              result: sessionData,
            },
            extensionSender,
          )
          expect(reconnect.reply.current.result).toEqual(sessionData)
          const recheck = dispatch({ method: 'checkConnection' }, dappSender)
          expect(recheck.reply.current).toEqual({
            result: { isConnected: true },
          })
        } finally {
          jest.useRealTimers()
        }
      })

      it('a boot snapshot lacking the epoch cannot revert an adopted epoch (grants still swept)', () => {
        // The epoch needs the same adoption latch as the mirror: the logout's
        // epoch write can land live while the boot get is still in flight, and
        // the stale snapshot (read before the logout — no epoch, and the
        // mirror still carrying the logout's already-expired stamp) must not
        // revert either adoption — a reverted epoch would let the pre-logout
        // grants answer for this worker's whole lifetime.
        const preEpochGrant = {
          'https://bridge.example': {
            ...sessionData,
            timestamp: Date.now() - 2 * 60 * 60 * 1000,
          },
        }
        const resolveBootGet = bootWithDeferredSnapshot(
          {
            connectedSites: preEpochGrant, // OLDER snapshot: pre-logout
            networkType: 'testnet',
            walletLockAt: Date.now() - 31 * 60 * 1000, // the logout's expired stamp
          },
          preEpochGrant,
        )

        // the logout's epoch write lands while the boot get is in flight
        // (its sweep no-ops: the in-memory map is still empty pre-snapshot)…
        landEpochWrite(Date.now())
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()

        // …and so does the re-unlock's fresh mirror re-stamp
        landMirrorWrite(Date.now())

        // then the STALE snapshot lands: no epoch, expired mirror
        resolveBootGet()

        // both adoptions survived: the mirror stayed fresh (no full revoke
        // from the snapshot's expired stamp) and the epoch swept the
        // pre-logout grant exactly once, at snapshot adoption time
        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(2) // both tabs, bridge.example only
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
          expect.any(Function),
        )
        const check = dispatch({ method: 'checkConnection' }, dappSender)
        expect(check.reply.current).toEqual({ result: { isConnected: false } })
      })

      it('legacy storage without an epoch: even an ancient grant keeps answering on a fresh mirror', () => {
        // Backwards compat: absent epoch → NO epoch-based deletion, whatever
        // the grant timestamp. Only the pre-existing mirror-expiry path (its
        // own tests above, which seed no epoch either) may sweep.
        bootWithMirror(freshUnlockMirror(), {
          'https://bridge.example': { ...sessionData, timestamp: 1 },
        })

        const session = dispatch({ method: 'getSession' }, dappSender)
        expect(session.reply.current.result).toMatchObject({
          network: 'testnet',
        })
        expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()
      })

      it('a grant approved with a timestamp EXACTLY equal to the epoch is swept (<= boundary)', () => {
        // Pins the sweep's fail-closed comparison: a grant survives only
        // when timestamp > epoch, so an approval completing in the same
        // millisecond as the logout's epoch write (timestamp === epoch) is
        // dead. A `>` → `>=` mutation would flip the boundary to fail-open
        // and this test fails on it.
        jest.useFakeTimers()
        try {
          jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
          bootWithMirror(null)

          // the logout's epoch write lands at T — nothing to sweep yet
          landEpochWrite(Date.now())
          expect(storageData.connectedSites).toEqual({})

          // an approval completes IN THE SAME millisecond: its approval-time
          // timestamp is exactly the epoch
          const connect = dispatch(
            { requestId: 'r1', method: 'connect', params: {} },
            dappSender,
          )
          dispatch(
            {
              action: 'popupResponse',
              method: 'connect',
              requestId: internalIdFor(700),
              origin: 'https://bridge.example',
              windowId: 700,
              result: sessionData,
            },
            extensionSender,
          )
          expect(connect.reply.current.result).toEqual(sessionData)
          expect(storageData.connectedSites['https://bridge.example']).toEqual(
            expect.objectContaining({ timestamp: Date.now() }),
          )

          // the next message's piggyback sweep observes timestamp === epoch
          // and deletes the grant durably, propagating to the site's tabs
          const check = dispatch({ method: 'checkConnection' }, dappSender)
          expect(check.reply.current).toEqual({
            result: { isConnected: false },
          })
          expect(storageData.connectedSites).toEqual({})
          expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
            1,
            {
              type: 'MOJITO_SESSION_REVOKED',
              origin: 'https://bridge.example',
            },
            expect.any(Function),
          )
        } finally {
          jest.useRealTimers()
        }
      })

      it('a grant of unprovable age (no timestamp field) fails closed: swept and propagated', () => {
        // Only handlePopupResponse creates grants (always timestamped), so a
        // timestampless grant can only be ancient/foreign durable storage.
        // With an epoch present its age cannot be proven to postdate the
        // revocation — it fails closed exactly like a grant without a
        // network stamp.
        bootWithMirror(
          freshUnlockMirror(),
          {
            'https://bridge.example': {
              address: sessionData.address,
              addressesByChain: sessionData.addressesByChain,
              network: 'testnet',
              // deliberately NO timestamp field
            },
          },
          epochAfterLogout(),
        )

        expect(storageData.connectedSites).toEqual({})
        expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
          1,
          {
            type: 'MOJITO_SESSION_REVOKED',
            origin: 'https://bridge.example',
          },
          expect.any(Function),
        )
        const check = dispatch({ method: 'checkConnection' }, dappSender)
        expect(check.reply.current).toEqual({
          result: { isConnected: false },
        })
      })
    })
  })

  // ── network-switch regression: grants are network-scoped ──
  // The wallet UI publishes its active network to chrome.storage.local
  // ('networkType') — the worker cannot read the wallet pages' localStorage.
  // A grant approved on one network must never answer after a switch:
  // checkConnection says disconnected, connect opens a FRESH approval,
  // getSession refuses, and the stale grant is revoked + propagated so open
  // dApp tabs drop their cached addresses.
  describe('network switch re-validation', () => {
    const mainnetSession = {
      address: { mainnet: { receiving: ['mtc1qabc'], change: ['mtc1qchg'] } },
      addressesByChain: {
        mintlayer: { receiving: ['mtc1qabc'], change: ['mtc1qchg'] },
      },
      network: 'mainnet',
    }

    // Simulates the wallet UI's switch write (SettingsProvider persists
    // 'networkType' to chrome.storage.local on every toggle).
    const publishNetwork = (network) => {
      storageData.networkType = network
      for (const listener of storageChangeListeners) {
        listener({ networkType: { newValue: network } }, 'local')
      }
    }

    // Boots a worker whose storage ALREADY holds a published network —
    // e.g. the switch happened while the MV3 worker was dead. Only the
    // fresh worker's listeners stay registered.
    const bootWithNetwork = (network, sites = {}) => {
      messageListeners.length = 0
      storageChangeListeners.length = 0
      windowRemovedListeners.length = 0
      createdWindows.length = 0
      global.chrome.tabs.query.mockClear()
      global.chrome.tabs.sendMessage.mockClear()
      storageData.networkType = network
      storageData.connectedSites = sites
      loadBackground()
    }

    const approve = (result, windowId = 700) => {
      dispatch({ requestId: 'r1', method: 'connect', params: {} }, dappSender)
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: internalIdFor(windowId),
          origin: 'https://bridge.example',
          windowId,
          result,
        },
        extensionSender,
      )
    }

    it('revokes a mainnet grant on switch to testnet and fails closed', () => {
      bootWithNetwork('mainnet')
      approve(mainnetSession)
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toMatchObject({ network: 'mainnet' })
      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: true } })

      // the wallet UI switches mainnet → testnet
      publishNetwork('testnet')

      // the stale grant was revoked proactively and the site's tabs told
      // to drop their cached addresses
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toBeUndefined()
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )

      // checkConnection fails closed on the new network
      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: false } })

      // getSession refuses: no stale mainnet addresses disclosed
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toEqual({ result: null })

      // connect opens a FRESH approval instead of answering the stale grant
      const reconnect = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        dappSender,
      )
      expect(reconnect.reply.current).toBeUndefined()
      expect(reconnect.keptOpen).toBe(true)
      expect(createdWindows).toHaveLength(2) // the first approval was 700
      expect(storageData['pendingRequest:701']).toMatchObject({
        action: 'connect',
        origin: 'https://bridge.example',
      })

      // re-approval ON THE NEW network answers with the NEW session
      dispatch(
        {
          action: 'popupResponse',
          method: 'connect',
          requestId: internalIdFor(701),
          origin: 'https://bridge.example',
          windowId: 701,
          result: sessionData, // testnet session
        },
        extensionSender,
      )
      expect(reconnect.reply.current.result).toEqual(sessionData)
      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: true } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toMatchObject({ result: { network: 'testnet' } })
    })

    it('same-network grants keep answering normally (no false revocation)', () => {
      bootWithNetwork('testnet')
      approve(sessionData)

      // re-publishing the SAME network must not revoke anything
      publishNetwork('testnet')
      expect(storageData.connectedSites['https://bridge.example']).toBeTruthy()
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalled()

      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: true } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toMatchObject({ result: { network: 'testnet' } })

      // an already-connected site is still answered from the stored grant
      const repeat = dispatch(
        { requestId: 'r9', method: 'connect', params: {} },
        dappSender,
      )
      expect(repeat.keptOpen).toBe(false)
      expect(
        repeat.reply.current.result.addressesByChain.mintlayer.receiving,
      ).toEqual(['tmtc1qabc'])
    })

    it('a worker that boots after a switch sweeps stale grants before answering', () => {
      // the switch happened while the worker was dead: storage holds the
      // NEW network AND the stale mainnet grant
      bootWithNetwork('testnet', {
        'https://bridge.example': { ...mainnetSession, timestamp: 1 },
      })

      // revoked at load, before any queued message is answered
      expect(storageData.connectedSites).toEqual({})
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )
      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: false } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toEqual({ result: null })
    })

    it('a grant that lands on the old network after the switch never answers', () => {
      // razor-edge race: the approval completes with a grant approved on
      // mainnet AFTER the wallet already switched to testnet (the sweep
      // already ran) — the read-side re-validation is the last line of
      // defense and must treat the stale grant as absent.
      bootWithNetwork('testnet')
      approve(mainnetSession)
      expect(
        storageData.connectedSites['https://bridge.example'],
      ).toMatchObject({ network: 'mainnet' })

      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: false } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toEqual({ result: null })
      // connect does NOT return the stale grant: fresh approval instead
      const reconnect = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        dappSender,
      )
      expect(reconnect.reply.current).toBeUndefined()
      expect(reconnect.keptOpen).toBe(true)
    })

    // The boot read and a live switch can interleave: storage.onChanged
    // adopts the NEW network while the boot get is still in flight, then
    // the boot callback lands with the OLDER (pre-switch) snapshot. The
    // snapshot must never revert the adopted network — reverting would
    // resurrect the very grants the adoption swept.
    it('a boot snapshot landing after an adopted switch cannot revert the network', () => {
      let resolveBootGet
      const realGet = global.chrome.storage.local.get
      // defer ONLY the boot read (['connectedSites', 'networkType',
      // 'walletLockAt']): its callback resolves later, after the switch was
      // adopted live
      global.chrome.storage.local.get = (keys, cb) => {
        if (Array.isArray(keys) && keys.includes('networkType')) {
          resolveBootGet = () =>
            cb({
              // OLDER snapshot: read before the switch (mainnet grant)
              connectedSites: {
                'https://bridge.example': { ...mainnetSession, timestamp: 1 },
              },
              networkType: 'mainnet',
            })
          return
        }
        realGet(keys, cb)
      }

      bootWithNetwork('mainnet', {
        'https://bridge.example': { ...mainnetSession, timestamp: 1 },
      })
      expect(resolveBootGet).toBeDefined()

      // the wallet UI switches mainnet → testnet while the boot get is in
      // flight: onChanged adopts testnet (its sweep no-ops — the map is
      // still empty at this point)
      publishNetwork('testnet')

      // ...then the stale pre-switch snapshot lands
      resolveBootGet()

      // the adopted (testnet) network wins: the mainnet grant is swept and
      // never answers
      expect(storageData.connectedSites).toEqual({})
      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: false } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toEqual({ result: null })
    })

    // Pre-upgrade grants carry no network stamp: they cannot be proven
    // current, so the first published network fails them closed — swept,
    // tabs notified, and the dApp must reconnect with a fresh approval.
    it('revokes pre-upgrade grants without a network stamp (fail closed)', () => {
      bootWithNetwork('testnet', {
        'https://bridge.example': {
          address: {
            testnet: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] },
          },
          addressesByChain: {
            mintlayer: { receiving: ['tmtc1qabc'], change: ['tmtc1qchg'] },
          },
          timestamp: 1,
        },
      })

      // swept at boot, before any message is answered
      expect(storageData.connectedSites).toEqual({})
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_SESSION_REVOKED', origin: 'https://bridge.example' },
        expect.any(Function),
      )

      expect(
        dispatch({ method: 'checkConnection' }, dappSender).reply.current,
      ).toEqual({ result: { isConnected: false } })
      expect(
        dispatch({ method: 'getSession' }, dappSender).reply.current,
      ).toEqual({ result: null })

      // connect opens a FRESH approval instead of answering the unstamped grant
      const reconnect = dispatch(
        { requestId: 'r2', method: 'connect', params: {} },
        dappSender,
      )
      expect(reconnect.reply.current).toBeUndefined()
      expect(reconnect.keptOpen).toBe(true)
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

    // Regression: restricted targets (chrome://, other extensions' pages,
    // about:, file:) can never host the wallet content script — sweeping
    // them used to surface user-visible errors like "Cannot access a
    // chrome:// URL". The sweep must consult the tab's url up front and
    // ping/re-inject ONLY injectable http(s) tabs.
    it('skips restricted targets (chrome://, extension pages) entirely', () => {
      global.chrome.tabs.query.mockImplementation((query, cb) =>
        cb([
          { id: 1, url: 'https://bridge.example/' },
          { id: 2, url: 'chrome://settings/' },
          { id: 3, url: `chrome-extension://${EXT_ID}/popup.html` },
          { id: 4, url: 'about:blank' },
          { id: 5, url: 'file:///home/user/page.html' },
        ]),
      )
      registeredListener(global.chrome.runtime.onInstalled)()

      // only the plain https tab was pinged...
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledTimes(1)
      expect(global.chrome.tabs.sendMessage).toHaveBeenCalledWith(
        1,
        { type: 'MOJITO_PING' },
        expect.any(Function),
      )
      // ...and none of the restricted targets were ever touched
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        2,
        expect.anything(),
        expect.anything(),
      )
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        3,
        expect.anything(),
        expect.anything(),
      )
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        4,
        expect.anything(),
        expect.anything(),
      )
      expect(global.chrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        5,
        expect.anything(),
        expect.anything(),
      )

      // the https tab's ping answers as a dead content script: exactly one
      // re-injection, for that tab only — restricted targets never get one
      answerPings({ withLastError: true })
      expect(global.chrome.scripting.executeScript).toHaveBeenCalledTimes(1)
      expect(global.chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: [CONTENT_SCRIPT_FILE],
      })
    })

    // Regression: without the "tabs" permission Chrome hides the tab url
    // (undefined) — such a tab is NOT restricted (it may be injectable), so
    // the sweep still pings it. But if the page turns out unreachable, the
    // failed re-injection used to log user-visible console.error noise
    // ("... manifest must request permission to access the respective
    // host."). Unreachable-by-design targets must stay quiet.
    it('stays quiet when injection fails on an unreachable page', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      try {
        global.chrome.tabs.query.mockImplementation((query, cb) =>
          cb([{ id: 1 }]),
        )
        global.chrome.scripting.executeScript = jest
          .fn()
          .mockRejectedValue(
            new Error(
              'Cannot access contents of the page. Extension manifest must request permission to access the respective host.',
            ),
          )

        registeredListener(global.chrome.runtime.onInstalled)()
        answerPings({ withLastError: true })

        // let the executeScript rejection settle into the .catch handler
        await Promise.resolve()
        await Promise.resolve()

        expect(global.chrome.scripting.executeScript).toHaveBeenCalledTimes(1)
        expect(consoleErrorSpy).not.toHaveBeenCalled()
      } finally {
        consoleErrorSpy.mockRestore()
      }
    })
  })
})
