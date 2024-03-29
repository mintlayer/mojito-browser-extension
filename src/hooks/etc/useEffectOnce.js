import { useEffect, useRef } from 'react'
export function useEffectOnce(effect) {
  const called = useRef(false)
  useEffect(() => {
    if (!called.current) {
      called.current = true
      effect()
    }
  }, [effect])
}
