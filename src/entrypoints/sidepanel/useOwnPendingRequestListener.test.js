import { renderHook } from '@testing-library/react'
import { useRef } from 'react'

import { useOwnPendingRequestListener } from './useOwnPendingRequestListener'

const OWN_WINDOW_ID = 7
const FOREIGN_WINDOW_ID = 2
const OWN_KEY = `pendingRequest:${OWN_WINDOW_ID}`
const FOREIGN_KEY = `pendingRequest:${FOREIGN_WINDOW_ID}`
const OWN_REQUEST = {
  requestId: 'req-own',
  action: 'connect',
  origin: 'https://own.example',
}
const FOREIGN_REQUEST = {
  requestId: 'req-foreign',
  action: 'connect',
  origin: 'https://foreign.example',
}

// chrome.storage.onChanged stand-in that keeps every registered listener, so
// a test fires change sets at exactly what the hook registered.
const createMockStorage = () => {
  const listeners = new Set()
  return {
    onChanged: {
      addListener: jest.fn((listener) => listeners.add(listener)),
      removeListener: jest.fn((listener) => listeners.delete(listener)),
    },
    registeredListeners: () => Array.from(listeners),
  }
}

const fireChange = (storage, changes, areaName = 'local') => {
  storage
    .registeredListeners()
    .forEach((listener) => listener(changes, areaName))
}

// Mirrors the surface: the hook mounts with no window id; the mount read
// records it once windows.getCurrent answers (recordWindowId stands in for
// that callback). The request ref is handed back so a test can replace the
// handler the way a re-render does.
const renderListener = (storage = createMockStorage()) => {
  const onRequest = jest.fn()
  const { result, unmount } = renderHook(() => {
    const onRequestRef = useRef(onRequest)
    const ownWindowIdRef = useOwnPendingRequestListener(storage, onRequestRef)
    return { ownWindowIdRef, onRequestRef }
  })
  return {
    storage,
    onRequest,
    onRequestRef: result.current.onRequestRef,
    recordWindowId: (windowId) => {
      result.current.ownWindowIdRef.current = windowId
    },
    unmount,
  }
}

describe('useOwnPendingRequestListener', () => {
  test("routes a change to this window's own key exactly once", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)

    expect(storage.onChanged.addListener).toHaveBeenCalledTimes(1)
    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onRequest).toHaveBeenCalledWith(OWN_REQUEST)
  })

  test("routes nothing for another window's key", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)

    fireChange(storage, { [FOREIGN_KEY]: { newValue: FOREIGN_REQUEST } })

    expect(onRequest).not.toHaveBeenCalled()
  })

  test("routes only this window's value when another window's key shares the change set", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)

    fireChange(storage, {
      [OWN_KEY]: { newValue: OWN_REQUEST },
      [FOREIGN_KEY]: { newValue: FOREIGN_REQUEST },
    })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onRequest).toHaveBeenCalledWith(OWN_REQUEST)
  })

  test("routes only this window's value when another window's key sorts first", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)
    const changes = {
      [FOREIGN_KEY]: { newValue: FOREIGN_REQUEST },
      [OWN_KEY]: { newValue: OWN_REQUEST },
    }
    expect(Object.keys(changes)).toEqual([FOREIGN_KEY, OWN_KEY])

    fireChange(storage, changes)

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onRequest).toHaveBeenCalledWith(OWN_REQUEST)
  })

  test("routes nothing when this window's key is removed", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)

    fireChange(storage, { [OWN_KEY]: { oldValue: OWN_REQUEST } })

    expect(onRequest).not.toHaveBeenCalled()
  })

  test("routes nothing for a change outside the 'local' area", () => {
    const { storage, onRequest, recordWindowId } = renderListener()
    recordWindowId(OWN_WINDOW_ID)

    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } }, 'sync')

    expect(onRequest).not.toHaveBeenCalled()
  })

  test("routes nothing until this window's id is known, then routes its own key", () => {
    const { storage, onRequest, recordWindowId } = renderListener()

    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } })
    expect(onRequest).not.toHaveBeenCalled()

    recordWindowId(OWN_WINDOW_ID)
    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } })

    expect(onRequest).toHaveBeenCalledTimes(1)
    expect(onRequest).toHaveBeenCalledWith(OWN_REQUEST)
  })

  test('dereferences the handler ref when the change fires, not when it registers', () => {
    const { storage, onRequest, onRequestRef, recordWindowId } =
      renderListener()
    const laterHandler = jest.fn()
    recordWindowId(OWN_WINDOW_ID)

    // the surface replaces its handler on every render; only the ref is stable
    onRequestRef.current = laterHandler
    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } })

    expect(laterHandler).toHaveBeenCalledTimes(1)
    expect(laterHandler).toHaveBeenCalledWith(OWN_REQUEST)
    expect(onRequest).not.toHaveBeenCalled()
  })

  test('removes its listener on unmount', () => {
    const { storage, onRequest, recordWindowId, unmount } = renderListener()
    recordWindowId(OWN_WINDOW_ID)
    const [listener] = storage.onChanged.addListener.mock.calls[0]
    expect(storage.registeredListeners()).toEqual([listener])

    unmount()

    expect(storage.onChanged.removeListener).toHaveBeenCalledWith(listener)
    expect(storage.registeredListeners()).toEqual([])
    fireChange(storage, { [OWN_KEY]: { newValue: OWN_REQUEST } })
    expect(onRequest).not.toHaveBeenCalled()
  })

  test('registers no listener when storage has no onChanged', () => {
    const storage = {}
    const { unmount } = renderListener(storage)

    expect(storage.onChanged).toBeUndefined()
    expect(() => unmount()).not.toThrow()
  })
})
