import { renderHook, act } from '@testing-library/react'
import useMediaQuery from './useMediaQuery'

const createMockMediaQueryList = (matches) => {
  const listeners = []
  return {
    matches,
    addEventListener: (event, handler) => listeners.push(handler),
    removeEventListener: (event, handler) => {
      const index = listeners.indexOf(handler)
      if (index > -1) listeners.splice(index, 1)
    },
    trigger(newMatches) {
      this.matches = newMatches
      listeners.forEach((handler) => handler())
    },
  }
}

let mockMediaQueryList

beforeEach(() => {
  mockMediaQueryList = createMockMediaQueryList(false)
  window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList)
})

test('useMediaQuery > returns initial match state (false)', () => {
  const { result } = renderHook(() => useMediaQuery('(min-width: 801px)'))
  expect(result.current).toBe(false)
})

test('useMediaQuery > returns initial match state (true)', () => {
  mockMediaQueryList = createMockMediaQueryList(true)
  window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList)

  const { result } = renderHook(() => useMediaQuery('(min-width: 801px)'))
  expect(result.current).toBe(true)
})

test('useMediaQuery > calls matchMedia with the correct query', () => {
  renderHook(() => useMediaQuery('(max-width: 767px)'))
  expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)')
})

test('useMediaQuery > updates when media query changes', () => {
  const { result } = renderHook(() => useMediaQuery('(min-width: 801px)'))
  expect(result.current).toBe(false)

  act(() => {
    mockMediaQueryList.trigger(true)
  })

  expect(result.current).toBe(true)
})

test('useMediaQuery > resubscribes when query changes', () => {
  const firstList = createMockMediaQueryList(false)
  const secondList = createMockMediaQueryList(true)

  window.matchMedia = jest.fn((query) =>
    query === '(min-width: 801px)' ? firstList : secondList,
  )

  const { result, rerender } = renderHook(({ query }) => useMediaQuery(query), {
    initialProps: { query: '(min-width: 801px)' },
  })

  expect(result.current).toBe(false)

  rerender({ query: '(max-width: 600px)' })

  expect(result.current).toBe(true)
})

test('useMediaQuery > cleans up listener on unmount', () => {
  const removeEventListener = jest.fn()
  mockMediaQueryList.removeEventListener = removeEventListener

  const { unmount } = renderHook(() => useMediaQuery('(min-width: 801px)'))
  unmount()

  expect(removeEventListener).toHaveBeenCalledWith(
    'change',
    expect.any(Function),
  )
})
