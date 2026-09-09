import { ReactNode } from 'react'
import styles from './Sheet.module.css'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  label?: string
  children: ReactNode
}

// Bottom sheet primitive from the design system: overlay + panel + handle.
const Sheet = ({ open, onClose, label, children }: SheetProps) => {
  if (!open) return null
  return createPortal(
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 60 }}
      data-screen-label={label || 'Bottom sheet'}
    >
      <div
        className={styles.backdrop}
        onClick={onClose}
      />
      <div className={styles.panel}>
        <div className={styles.handle} />
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Sheet
