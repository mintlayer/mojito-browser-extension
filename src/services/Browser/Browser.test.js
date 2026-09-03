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
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
    }
    global.chrome = chromeMock

    const { runtime, storage } = loadBrowserModule()

    expect(runtime).toBe(chromeMock.runtime)
    expect(storage).toBe(chromeMock.storage)
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

  it('sends a result response and clears the pending request', () => {
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
    }
    global.chrome = chromeMock

    const { sendPopupResponse } = loadBrowserModule()

    sendPopupResponse({
      method: 'connect',
      requestId: 'r1',
      origin: 'https://dapp.example',
      result: { address: {} },
    })

    expect(chromeMock.runtime.sendMessage).toHaveBeenCalledWith(
      {
        action: 'popupResponse',
        method: 'connect',
        requestId: 'r1',
        origin: 'https://dapp.example',
        result: { address: {} },
      },
      expect.any(Function),
    )

    chromeMock.runtime.sendMessage.mock.calls[0][1]()
    expect(chromeMock.storage.local.remove).toHaveBeenCalledWith(
      'pendingRequest',
      expect.any(Function),
    )
  })

  it('sends an error response without a result field', () => {
    const chromeMock = {
      runtime: { id: 'test-id', sendMessage: jest.fn() },
      storage: { local: { remove: jest.fn() } },
    }
    global.chrome = chromeMock

    const { sendPopupResponse } = loadBrowserModule()

    sendPopupResponse({
      method: 'signTransaction_reject',
      requestId: 'r2',
      origin: 'https://dapp.example',
      error: 'Transaction rejected',
    })

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
