import styles from './LivePill.module.css'

interface LivePillProps {
  value: number
  suffix?: string
}

// Small +/- 24h change pill from the design system.
const LivePill = ({ value, suffix = '%' }: LivePillProps) => {
  const positive = value >= 0
  return (
    <span
      className={`${styles.pill} ${positive ? styles.positive : styles.negative}`}
      data-testid="live-pill"
    >
      <span>{positive ? '▲' : '▼'}</span>
      {Math.abs(value).toFixed(2)}
      {suffix}
    </span>
  )
}

export default LivePill
