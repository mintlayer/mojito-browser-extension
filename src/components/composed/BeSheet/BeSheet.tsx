import { ReactNode } from 'react'
import styles from './BeSheet.module.css'
import Sheet from '../../basic/Sheet/Sheet'

interface BeSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  label?: string
  children: ReactNode
}

// Titled, scrollable bottom sheet (design system). Composes the Sheet basic.
const BeSheet = ({ open, onClose, title, label, children }: BeSheetProps) => {
  if (!open) return null
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={label || title || 'Sheet'}
    >
      {title && <div className={styles.title}>{title}</div>}
      <div className={styles.scroll}>{children}</div>
    </Sheet>
  )
}

export default BeSheet
