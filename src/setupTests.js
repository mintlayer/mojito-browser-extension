// CRITICAL: Buffer polyfill MUST be first, before any other imports
// This ensures ECC libraries get polyfilled Buffer during their import/validation
import { Buffer as PolyfillBuffer } from './../node_modules/buffer'

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import 'jest-canvas-mock'
import 'jest-webgl-canvas-mock'

// Polyfills for crypto libraries
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

global.Buffer = PolyfillBuffer
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = PolyfillBuffer
}

// Crypto polyfill for Node.js environment
if (typeof global.crypto === 'undefined') {
  const { webcrypto } = require('crypto')
  global.crypto = webcrypto
}

// Buffer polyfill already set at the top of this file before any imports
// This ensures ECC libraries get consistent Buffer/Uint8Array behavior

// Additional crypto environment setup for consistent behavior
if (typeof global.crypto !== 'undefined' && global.crypto.getRandomValues) {
  // Ensure crypto.getRandomValues works consistently with Uint8Array
  const originalGetRandomValues = global.crypto.getRandomValues.bind(global.crypto)
  global.crypto.getRandomValues = function(array) {
    return originalGetRandomValues(array)
  }
}

// Ensure process.browser is set for libraries that check environment
if (typeof global.process === 'undefined') {
  global.process = { browser: false, env: { NODE_ENV: 'test' } }
} else if (typeof global.process.browser === 'undefined') {
  global.process.browser = false
}
