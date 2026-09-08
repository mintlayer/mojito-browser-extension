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
})
