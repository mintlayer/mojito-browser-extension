// Counter — animated number ticker. Basic: no dependencies.
const { useState, useEffect } = React

function Counter({
  value,
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 1200,
}) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(value * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return (
    <span className="tnum">
      {prefix}
      {v.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}

Object.assign(window, { Counter })
