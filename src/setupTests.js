// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import 'jest-canvas-mock'
import 'jest-webgl-canvas-mock'
import { Buffer } from 'buffer'

// Polyfills for crypto libraries
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Crypto polyfill for Node.js environment
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  global.crypto = webcrypto
}

// Buffer polyfill
global.Buffer = Buffer

// Save the original fetch for integration tests
global.originalFetch = global.fetch

// Fetch mock for jsdom - returns empty response by default
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve('{}'),
  }),
)

// AbortSignal.timeout polyfill
if (!global.AbortSignal.timeout) {
  global.AbortSignal.timeout = (ms) => {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), ms)
    return controller.signal
  }
}

// Reset fetch mock before each test
beforeEach(() => {
  if (global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})
