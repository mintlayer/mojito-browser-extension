import styles from './SiteBadge.module.css'

interface SiteBadgeProps {
  origin: string
  unknown?: boolean
}

const SiteBadge = ({ origin, unknown = false }: SiteBadgeProps) => {
  const badgeStyles = [styles.badge, unknown ? styles.unknown : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={badgeStyles}
      title={origin}
    >
      <span className={styles.dot} />
      <span className={styles.origin}>{origin}</span>
    </div>
  )
}

export default SiteBadge
