import { useEffect, useRef, useState } from 'react'
import styles from './Counter.module.css'

interface CounterProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}

// Animated number ticker from the design system. Interpolates from the
// PREVIOUS value (not from zero — a periodic refresh must not re-roll the
// balance through $0.00) and respects prefers-reduced-motion.
const Counter = ({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1200,
}: CounterProps) => {
  const [v, setV] = useState(value)
  const previousValue = useRef(value)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = previousValue.current
    previousValue.current = value

    if (reduceMotion || from === value) {
      // sync prop->state sync (documented React "adjust state when props
      // change" pattern) — no animation needed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setV(value)
      return
    }

    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(from + (value - from) * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <span
      className={styles.tnum}
      data-testid="counter"
    >
      {prefix}
      {v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

export default Counter
