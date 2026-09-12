import { ReactNode } from 'react'
import styles from './Tag.module.css'

interface TagProps {
  c?: 'grey' | 'amber' | 'teal' | 'green' | 'violet' | 'red'
  children: ReactNode
}

// Small colored label pill from the design system.
const Tag = ({ c = 'grey', children }: TagProps) => {
  return (
    <span
      className={`${styles.tag} ${styles[c]}`}
      data-testid="tag"
    >
      {children}
    </span>
  )
}

export default Tag
