import styles from './DelegationSkeleton.module.css'

const DelegationSkeleton = () => (
  <li className={styles.card}>
    <div className={`${styles.icon} ${styles.shimmer}`} />
    <div className={styles.info}>
      <div className={`${styles.poolId} ${styles.shimmer}`} />
      <div className={`${styles.date} ${styles.shimmer}`} />
    </div>
    <div className={styles.amount}>
      <div className={`${styles.amountValue} ${styles.shimmer}`} />
      <div className={`${styles.amountCurrency} ${styles.shimmer}`} />
    </div>
    <div className={styles.actions}>
      <div className={`${styles.button} ${styles.shimmer}`} />
      <div className={`${styles.button} ${styles.shimmer}`} />
    </div>
  </li>
)

export default DelegationSkeleton
