/**
 * Tests for the injected content script (public/explorer/content-script.js):
 * relays page requests to the background and — critically — answers the page
 * with a structured error when the extension context is invalidated (the
 * extension was reloaded/updated/disabled while the page stayed open),
 * instead of leaving the page's promise hanging forever.
 */
const fs = require('fs')
const path = require('path')

const CONTENT_SCRIPT_SRC = fs.readFileSync(
  path.join(__dirname, 'content-script.js'),
  'utf8',
)

// jsdom's MessageEvent.source is a different wrapper object than the global
// window (in browsers they are identical), which would make the script's
// `event.source !== window` guard drop every message.
Object.defineProperty(MessageEvent.prototype, 'source', {
  get: () => window,
  configurable: true,
})

const sendMessageCalls = []
let messageListeners = []
let addSpy
// Listeners the content script registers on chrome.runtime.onMessage
// (currently the MOJITO_SESSION_REVOKED relay), so tests can invoke them.
let onMessageListeners = []

const setup = ({ sendMessageImpl }) => {
  sendMessageCalls.length = 0
  global.browser = undefined
  onMessageListeners = []
  global.chrome = {
    runtime: {
      id: 'ext-id',
      getURL: (p) => `chrome-extension://ext-id/${p}`,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendMessage: (message, callback) => {
        sendMessageCalls.push(message)
        sendMessageImpl(message, callback)
      },
      onMessage: {
        addListener: jest.fn((listener) => onMessageListeners.push(listener)),
      },
      lastError: null,
    },
  }

  // Track the content script's message listener so it can be removed after
  // the test (the IIFE registers it on the shared jsdom window). Call through
  // so test-side listeners still register normally.
  messageListeners = []
  addSpy?.mockRestore()
  const originalAddEventListener = window.addEventListener.bind(window)
  addSpy = jest
    .spyOn(window, 'addEventListener')
    .mockImplementation((type, fn, opts) => {
      if (type === 'message') messageListeners.push(fn)
      return originalAddEventListener(type, fn, opts)
    })

  // eslint-disable-next-line no-eval
  window.eval(CONTENT_SCRIPT_SRC)
}

afterEach(() => {
  for (const fn of messageListeners) {
    window.removeEventListener('message', fn)
  }
  messageListeners = []
  addSpy?.mockRestore()
})

const nextMessage = () =>
  new Promise((resolve) => {
    const listener = (event) => {
      if (event.data?.type === 'MINTLAYER_RESPONSE') {
        window.removeEventListener('message', listener)
        resolve(event.data)
      }
    }
    window.addEventListener('message', listener)
  })

describe('content script relay', () => {
  it('relays a page request to the background and back', async () => {
    setup({
      sendMessageImpl: (_message, callback) => {
        callback({ result: { isConnected: true } })
      },
    })

    const incoming = nextMessage()
    window.postMessage(
      { type: 'MINTLAYER_REQUEST', requestId: 'r1', method: 'checkConnection' },
      '*',
    )

    await expect(incoming).resolves.toEqual({
      type: 'MINTLAYER_RESPONSE',
      requestId: 'r1',
      result: { isConnected: true },
      error: undefined,
    })
    // [0] is the load-time getSession probe, the relay forwards the request
    expect(sendMessageCalls[sendMessageCalls.length - 1]).toMatchObject({
      requestId: 'r1',
      method: 'checkConnection',
    })
  })

  it('answers CONTEXT_INVALIDATED when sendMessage throws (extension reloaded)', async () => {
    setup({
      sendMessageImpl: () => {
        // Chrome throws synchronously once the extension context is gone.
        throw new Error('Extension context invalidated.')
      },
    })

    const incoming = nextMessage()
    window.postMessage(
      { type: 'MINTLAYER_REQUEST', requestId: 'r1', method: 'connect' },
      '*',
    )

    await expect(incoming).resolves.toMatchObject({
      type: 'MINTLAYER_RESPONSE',
      requestId: 'r1',
      error: {
        code: 'CONTEXT_INVALIDATED',
        message: expect.stringContaining('Reload this page'),
      },
    })

    // Subsequent requests fail fast with the same code, without touching the
    // dead runtime again.
    const second = nextMessage()
    window.postMessage(
      { type: 'MINTLAYER_REQUEST', requestId: 'r2', method: 'connect' },
      '*',
    )
    await expect(second).resolves.toMatchObject({
      error: { code: 'CONTEXT_INVALIDATED' },
    })
    // after invalidation no further runtime calls are attempted
    expect(sendMessageCalls.filter((m) => m.requestId === 'r2')).toHaveLength(0)
  })
})

describe('runtime lastError path', () => {
  const nextResponse = () =>
    new Promise((resolve) => {
      const listener = (event) => {
        if (event.data?.type === 'MINTLAYER_RESPONSE') {
          window.removeEventListener('message', listener)
          resolve(event.data)
        }
      }
      window.addEventListener('message', listener)
    })

  it('answers the page with EXTENSION_ERROR when the background errors', async () => {
    global.browser = undefined
    global.chrome = {
      runtime: {
        id: 'ext-id',
        getURL: (p) => `chrome-extension://ext-id/${p}`,
        sendMessage: (message, callback) => {
          // MV3 sets lastError instead of throwing when the port dies
          Object.defineProperty(chrome.runtime, 'lastError', {
            value: {
              message:
                'The message port closed before a response was received.',
            },
            configurable: true,
          })
          callback(undefined)
        },
        onMessage: { addListener: jest.fn() },
        lastError: null,
      },
    }

    // eslint-disable-next-line no-eval
    window.eval(CONTENT_SCRIPT_SRC)

    const incoming = nextResponse()
    window.postMessage(
      { type: 'MINTLAYER_REQUEST', requestId: 'e1', method: 'connect' },
      '*',
    )

    await expect(incoming).resolves.toMatchObject({
      requestId: 'e1',
      error: { code: 'EXTENSION_ERROR' },
    })
    delete chrome.runtime.lastError
  })
})

describe('reload ownership', () => {
  const bootInstance = () => {
    // eslint-disable-next-line no-eval
    window.eval(CONTENT_SCRIPT_SRC)
  }

  it('lets a freshly injected instance take over from an orphaned one', async () => {
    const responses = []
    const listener = (event) => {
      if (event.data?.type === 'MINTLAYER_RESPONSE') responses.push(event.data)
    }
    window.addEventListener('message', listener)

    // instance 1 (later orphaned)
    setup({
      sendMessageImpl: (_m, cb) => cb({ result: { from: 'old' } }),
    })

    // instance 2 (fresh injection after extension reload)
    setup({
      sendMessageImpl: (_m, cb) => cb({ result: { from: 'new' } }),
    })

    window.postMessage(
      { type: 'MINTLAYER_REQUEST', requestId: 'own1', method: 'connect' },
      '*',
    )
    await new Promise((resolve) => setTimeout(resolve, 10))

    // exactly one answer, from the current owner — the orphan must not
    // poison the fresh channel with a stale error
    expect(responses).toHaveLength(1)
    expect(responses[0].result).toEqual({ from: 'new' })
    window.removeEventListener('message', listener)
  })
})

describe('session revocation relay', () => {
  const nextDisconnect = () =>
    new Promise((resolve) => {
      const listener = (event) => {
        if (
          event.data?.type === 'MINTLAYER_EVENT' &&
          event.data.event === 'disconnect'
        ) {
          window.removeEventListener('message', listener)
          resolve(event.data)
        }
      }
      window.addEventListener('message', listener)
    })

  it('relays MOJITO_SESSION_REVOKED from the background to the page as a disconnect event', async () => {
    setup({
      sendMessageImpl: (_message, callback) => {
        callback({ result: null })
      },
    })

    // The content script registered exactly one runtime.onMessage listener
    expect(onMessageListeners).toHaveLength(1)

    const incoming = nextDisconnect()
    onMessageListeners[0]({
      type: 'MOJITO_SESSION_REVOKED',
      origin: window.location.origin,
    })

    await expect(incoming).resolves.toMatchObject({
      type: 'MINTLAYER_EVENT',
      event: 'disconnect',
      data: { origin: window.location.origin },
    })
  })

  it('ignores revocation messages for other origins or of other types', async () => {
    setup({
      sendMessageImpl: (_message, callback) => {
        callback({ result: null })
      },
    })

    const disconnects = []
    const listener = (event) => {
      if (
        event.data?.type === 'MINTLAYER_EVENT' &&
        event.data.event === 'disconnect'
      ) {
        disconnects.push(event.data)
      }
    }
    window.addEventListener('message', listener)

    onMessageListeners[0]({
      type: 'MOJITO_SESSION_REVOKED',
      origin: 'https://other-origin.example',
    })
    onMessageListeners[0]({
      type: 'SOMETHING_ELSE',
      origin: window.location.origin,
    })
    await new Promise((resolve) => setTimeout(resolve, 10))
    window.removeEventListener('message', listener)

    expect(disconnects).toHaveLength(0)
  })
})
