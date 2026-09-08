import styles from './ChainBadge.module.css'

interface ChainBadgeProps {
  chain: string
}

const MAP: Record<string, { color: string; soft: string }> = {
  Mintlayer: { color: 'var(--be-teal)', soft: 'var(--be-teal-soft)' },
  Bitcoin: { color: 'var(--be-amber)', soft: 'var(--be-amber-soft)' },
}

// Small chain pill with a glowing dot (design system).
const ChainBadge = ({ chain }: ChainBadgeProps) => {
  const t = MAP[chain] || {
    color: 'var(--be-text-2)',
    soft: 'oklch(1 0 0 / 0.05)',
  }
  return (
    <span
      className={styles.badge}
      style={{ color: t.color, background: t.soft, borderColor: t.color }}
      data-testid="chain-badge"
    >
      <span className={styles.dot} />
      {chain.toUpperCase()}
    </span>
  )
}

export default ChainBadge
