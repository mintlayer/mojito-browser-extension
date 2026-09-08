import { useEffect, useState } from 'react'
import styles from './Counter.module.css'

interface CounterProps {
  value: number
  decimals?: number
  prefix?: string
  suffix?: string
  duration?: number
}

// Animated number ticker from the design system.
const Counter = ({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1200,
}: CounterProps) => {
  const [v, setV] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let raf: number
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
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
