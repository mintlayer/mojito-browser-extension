import { useEffect, useRef } from 'react'

export const useOnClickOutside = (ref, handler) => {
  const effectCalled = useRef(false)
  const isPartOfModalWindow = (event) =>
    !ref.current || ref.current.contains(event.target)

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    const listener = (event) => {
      if (isPartOfModalWindow(event)) return
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [])
}
