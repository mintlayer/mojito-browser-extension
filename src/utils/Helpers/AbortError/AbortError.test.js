import { isAbortError } from './AbortError'

describe('isAbortError', () => {
  test('returns true for a DOMException AbortError', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError')
    expect(isAbortError(error)).toBe(true)
  })

  test('returns true for a plain object named AbortError', () => {
    expect(isAbortError({ name: 'AbortError' })).toBe(true)
  })

  test('returns false for a generic Error', () => {
    expect(isAbortError(new Error('network down'))).toBe(false)
  })

  test('returns false for a TypeError', () => {
    expect(isAbortError(new TypeError('not a function'))).toBe(false)
  })

  test('returns false for undefined and null', () => {
    expect(isAbortError(undefined)).toBe(false)
    expect(isAbortError(null)).toBe(false)
  })
})
