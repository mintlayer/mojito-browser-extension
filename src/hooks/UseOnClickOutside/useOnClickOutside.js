import { useEffect } from 'react'

export const useOnClickOutside = (ref, handler) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isPartOfModalWindow = (event) =>
    !ref.current || ref.current.contains(event.target)

  useEffect(() => {
    /* istanbul ignore next */

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
  }, [ref, handler, isPartOfModalWindow])
}
