import { ReactNode } from 'react'
import styles from './Eyebrow.module.css'

interface EyebrowProps {
  children: ReactNode
}

// Small uppercase section label from the design system.
const Eyebrow = ({ children }: EyebrowProps) => {
  return (
    <div
      className={styles.eyebrow}
      data-testid="eyebrow"
    >
      {children}
    </div>
  )
}

export default Eyebrow
