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
      {rows.map(([k, v], index) => (
        <div
          className={styles.row}
          // label + index: labels repeat legitimately (e.g. one Amount row
          // per asset), so the label alone is not a unique key
          key={`${k}-${index}`}
        >
          <span className={styles.key}>{k}</span>
          <span className={styles.value}>{v}</span>
        </div>
      ))}
    </div>
  )
}

export default KV
