import { ReactNode, CSSProperties } from 'react'
import styles from './PageWrapper.module.css'

interface PageWrapperProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

const PageWrapper = ({ children, style, className }: PageWrapperProps) => {
  const classNames = [styles.wrapper, className].filter(Boolean).join(' ')
  return (
    <section
      className={classNames}
      style={style}
    >
      {children}
    </section>
  )
}

export default PageWrapper
