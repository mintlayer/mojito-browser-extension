import { ReactNode } from 'react'
import styles from './KV.module.css'

interface KVProps {
  rows: Array<[string, ReactNode]>
}

// Key/value list card from the design system.
const KV = ({ rows }: KVProps) => {
  return (
    <div
      className={styles.kvCard}
      data-testid="kv"
    >
      {rows.map(([k, v]) => (
        <div
          className={styles.row}
          key={k}
        >
          <span className={styles.key}>{k}</span>
          <span className={styles.value}>{v}</span>
        </div>
      ))}
    </div>
  )
}

export default KV
