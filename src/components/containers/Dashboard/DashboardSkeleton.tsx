import React from 'react'
import styles from './DashboardSkeleton.module.css'

const StatisticsSkeleton: React.FC = () => (
  <ul>
    <li className={`stat-item ${styles.statItemSkeleton}`}>
      <dt className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}></dt>
      <dd
        className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`}
      ></dd>
    </li>
    <li className={`stat-item ${styles.statItemSkeleton}`}>
      <dt className={`${styles.skeletonLine} ${styles.skeletonLineWide}`}></dt>
      <dd
        className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`}
      ></dd>
    </li>
  </ul>
)

const BalanceSkeleton: React.FC = () => (
  <span className={styles.balanceSkeleton}>
    <span
      className={`${styles.skeletonLine} ${styles.skeletonLineBalance}`}
    ></span>
  </span>
)

export { StatisticsSkeleton, BalanceSkeleton }
