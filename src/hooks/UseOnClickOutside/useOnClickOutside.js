import { useEffect } from 'react'

export const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    /* istanbul ignore next */
    const isPartOfModalWindow = (event) =>
      !ref.current || ref.current.contains(event.target)

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
  }, [ref, handler])
}
