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

const setup = ({ sendMessageImpl }) => {
  sendMessageCalls.length = 0
  global.browser = undefined
  global.chrome = {
    runtime: {
      id: 'ext-id',
      getURL: (p) => `chrome-extension://ext-id/${p}`,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendMessage: (message, callback) => {
        sendMessageCalls.push(message)
        sendMessageImpl(message, callback)
      },
      lastError: null,
    },
  }

  // Track the content script's message listener so it can be removed after
  // the test (the IIFE registers it on the shared jsdom window). Call through
  // so test-side listeners still register normally.
  messageListeners = []
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
