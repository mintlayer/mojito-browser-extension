/* eslint-disable no-undef */
const loadBrowserModule = () => {
  let moduleUnderTest

  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    moduleUnderTest = require('./Browser')
  })

  return moduleUnderTest
}

describe('Browser', () => {
  afterEach(() => {
    delete global.chrome
    delete global.browser
  })

  it('picks the chrome APIs when browser is not available', () => {
    const windows = { getCurrent: jest.fn() }
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
      windows,
    }
    global.chrome = chromeMock

    const { runtime, storage, windows: windowsApi } = loadBrowserModule()

    expect(runtime).toBe(chromeMock.runtime)
    expect(storage).toBe(chromeMock.storage)
    expect(windowsApi).toBe(chromeMock.windows)
  })

  it('picks the browser APIs when available', () => {
    const browserMock = {
      runtime: { id: 'ff-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
    }
    global.browser = browserMock

    const { runtime, storage } = loadBrowserModule()

    expect(runtime).toBe(browserMock.runtime)
    expect(storage).toBe(browserMock.storage)
  })

  it('exposes null APIs outside an extension', () => {
    const { runtime, storage } = loadBrowserModule()

    expect(runtime).toBeNull()
    expect(storage).toBeNull()
  })

  it('sends a result response tagged with the popup window id', async () => {
    const windows = { getCurrent: jest.fn((cb) => cb({ id: 42 })) }
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
      windows,
    }
    global.chrome = chromeMock

    const { sendPopupResponse } = loadBrowserModule()

    sendPopupResponse({
      method: 'connect',
      requestId: 'r1',
      origin: 'https://dapp.example',
      result: { address: {} },
    })
    await Promise.resolve() // flush the windows.getCurrent callback

    expect(windows.getCurrent).toHaveBeenCalled()
    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith(
      {
        action: 'popupResponse',
        method: 'connect',
        requestId: 'r1',
        origin: 'https://dapp.example',
        windowId: 42,
        result: { address: {} },
      },
      expect.any(Function),
    )
  })

  it('sends an error response without a result field', async () => {
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
      windows: { getCurrent: jest.fn((cb) => cb({ id: 7 })) },
    }
    global.chrome = chromeMock

    const { sendPopupResponse } = loadBrowserModule()

    sendPopupResponse({
      method: 'signTransaction_reject',
      requestId: 'r2',
      origin: 'https://dapp.example',
      error: 'Transaction rejected',
    })
    await Promise.resolve()

    const payload = chromeMock.runtime.sendMessage.mock.calls[0][0]
    expect(payload.error).toBe('Transaction rejected')
    expect(payload).not.toHaveProperty('result')
  })

  it('does nothing when no extension APIs are available', () => {
    const { sendPopupResponse } = loadBrowserModule()

    expect(() =>
      sendPopupResponse({ method: 'connect', requestId: 'r3', origin: 'x' }),
    ).not.toThrow()
  })

  describe('notifyApprovalDisplayed', () => {
    it('sends exactly the approvalDisplayed ack for the request', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyApprovalDisplayed } = loadBrowserModule()

      notifyApprovalDisplayed('req-1')

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1)
      const [payload, callback] = chromeMock.runtime.sendMessage.mock.calls[0]
      // exactly { action, requestId }: no extra fields
      expect(payload).toEqual({
        action: 'approvalDisplayed',
        requestId: 'req-1',
      })
      expect(callback).toEqual(expect.any(Function))

      // the fire-and-forget reply callback must tolerate a lastError
      // response (no responder is expected for this message)
      chromeMock.runtime.lastError = { message: 'No responder' }
      expect(() => callback()).not.toThrow()
    })

    it('is a no-op when the requestId is missing', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyApprovalDisplayed } = loadBrowserModule()

      expect(() => notifyApprovalDisplayed()).not.toThrow()
      expect(() => notifyApprovalDisplayed('')).not.toThrow()
      expect(chromeMock.runtime.sendMessage).not.toHaveBeenCalled()
    })

    it('swallows sendMessage throwing (messaging unavailable)', () => {
      const chromeMock = {
        runtime: {
          id: 'test-id',
          sendMessage: jest.fn(() => {
            throw new Error('Extension context invalidated')
          }),
        },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyApprovalDisplayed } = loadBrowserModule()

      expect(() => notifyApprovalDisplayed('req-1')).not.toThrow()
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('notifyWalletLocked', () => {
    it('sends exactly the walletLocked action', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      notifyWalletLocked()

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1)
      const [payload, callback] = chromeMock.runtime.sendMessage.mock.calls[0]
      // exactly { action }: no extra fields
      expect(payload).toEqual({ action: 'walletLocked' })
      expect(callback).toEqual(expect.any(Function))

      // the reply callback must tolerate a lastError (worker dead / no
      // responder alive): that is exactly the re-send trigger, and it stays
      // bounded at one
      chromeMock.runtime.lastError = { message: 'No responder' }
      expect(() => callback()).not.toThrow()
    })

    it('is a no-op when no extension APIs are available', () => {
      const { notifyWalletLocked } = loadBrowserModule()

      expect(() => notifyWalletLocked()).not.toThrow()
    })

    it('re-sends once when the background reports a failed revocation', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      chromeMock.runtime.sendMessage.mockImplementation((payload, cb) => {
        if (chromeMock.runtime.sendMessage.mock.calls.length === 1) {
          cb({ error: 'quota exceeded' })
        } else {
          cb({ result: { revoked: 2 } })
        }
      })

      notifyWalletLocked()

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(2)
      // the re-send is the same action, nothing else attached
      expect(chromeMock.runtime.sendMessage.mock.calls[1][0]).toEqual({
        action: 'walletLocked',
      })
    })

    it('does not re-send when the background answers success', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      chromeMock.runtime.sendMessage.mockImplementation((payload, cb) => {
        cb({ result: { revoked: 2 } })
      })

      notifyWalletLocked()

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1)
    })

    it('stops after one retry when the background keeps failing', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn() },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      chromeMock.runtime.sendMessage.mockImplementation((payload, cb) => {
        cb({ error: 'quota exceeded' })
      })

      notifyWalletLocked()

      // bounded: one automatic re-send, then the persisted lock mirror is
      // the remaining safety net (sweep on the worker's next boot)
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('stops after one re-send when every delivery hits runtime.lastError', () => {
      const chromeMock = {
        runtime: { id: 'test-id', sendMessage: jest.fn(), lastError: null },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      // every delivery reports undeliverable (worker keeps dying before the
      // retry lands) — the re-send must stay bounded at one
      chromeMock.runtime.sendMessage.mockImplementation((payload, cb) => {
        chromeMock.runtime.lastError = { message: 'No responder' }
        cb()
      })

      notifyWalletLocked()

      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(2)
    })

    it('swallows sendMessage throwing (messaging unavailable)', () => {
      const chromeMock = {
        runtime: {
          id: 'test-id',
          sendMessage: jest.fn(() => {
            throw new Error('Extension context invalidated')
          }),
        },
        storage: { local: { remove: jest.fn() } },
      }
      global.chrome = chromeMock

      const { notifyWalletLocked } = loadBrowserModule()

      expect(() => notifyWalletLocked()).not.toThrow()
      expect(chromeMock.runtime.sendMessage).toHaveBeenCalledTimes(1)
    })
  })

  describe('stampWalletLock', () => {
    it('writes the lock timestamp to chrome.storage.local', () => {
      const set = jest.fn()
      const chromeMock = {
        runtime: { id: 'test-id', lastError: null },
        storage: { local: { set } },
      }
      global.chrome = chromeMock

      const { stampWalletLock } = loadBrowserModule()

      stampWalletLock(1700000000000)

      expect(set).toHaveBeenCalledTimes(1)
      const [payload, callback] = set.mock.calls[0]
      // exactly { walletLockAt }: no extra fields
      expect(payload).toEqual({ walletLockAt: 1700000000000 })
      expect(callback).toEqual(expect.any(Function))

      // a failed set is retried ONCE with the same value (idempotent); the
      // failure path must tolerate the lastError signal without throwing
      chromeMock.runtime.lastError = { message: 'Storage unavailable' }
      expect(() => callback()).not.toThrow()
      expect(set).toHaveBeenCalledTimes(2)
      expect(set.mock.calls[1][0]).toEqual({ walletLockAt: 1700000000000 })
    })

    it('writes null for legacy/pre-fix callers (worker treats it as no clock observed)', () => {
      const set = jest.fn()
      global.chrome = {
        runtime: { id: 'test-id', lastError: null },
        storage: { local: { set } },
      }

      const { stampWalletLock } = loadBrowserModule()

      stampWalletLock(null)

      expect(set).toHaveBeenCalledWith(
        { walletLockAt: null },
        expect.any(Function),
      )
    })

    it('is a no-op when no storage APIs are available', () => {
      const { stampWalletLock } = loadBrowserModule()

      expect(() => stampWalletLock(123)).not.toThrow()
    })

    it('swallows storage throwing (storage unavailable)', () => {
      global.chrome = {
        runtime: { id: 'test-id', lastError: null },
        storage: {
          local: {
            set: jest.fn(() => {
              throw new Error('storage context gone')
            }),
          },
        },
      }

      const { stampWalletLock } = loadBrowserModule()

      expect(() => stampWalletLock(123)).not.toThrow()
      expect(global.chrome.storage.local.set).toHaveBeenCalledTimes(1)
    })

    it('gives up after one retry when every set reports a lastError', () => {
      const chromeMock = {
        runtime: { id: 'test-id', lastError: null },
        storage: { local: { set: jest.fn() } },
      }
      chromeMock.storage.local.set.mockImplementation((_payload, callback) => {
        chromeMock.runtime.lastError = { message: 'Storage unavailable' }
        callback()
      })
      global.chrome = chromeMock

      const { stampWalletLock } = loadBrowserModule()

      stampWalletLock(1700000000000)

      // exactly one rewrite: a persistently failing storage must not loop
      expect(chromeMock.storage.local.set).toHaveBeenCalledTimes(2)
      expect(chromeMock.storage.local.set.mock.calls[1][0]).toEqual({
        walletLockAt: 1700000000000,
      })
    })

    it('does not retry when the set succeeds', () => {
      const chromeMock = {
        runtime: { id: 'test-id', lastError: null },
        storage: { local: { set: jest.fn() } },
      }
      chromeMock.storage.local.set.mockImplementation((_payload, callback) => {
        callback()
      })
      global.chrome = chromeMock

      const { stampWalletLock } = loadBrowserModule()

      stampWalletLock(1700000000000)

      expect(chromeMock.storage.local.set).toHaveBeenCalledTimes(1)
    })
  })
})
