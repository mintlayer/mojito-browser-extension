import { ReactNode } from 'react'
import styles from './OptionCard.module.css'

interface OptionCardProps {
  icon: ReactNode
  title: string
  description: string
  linkText?: string
  onClick: () => void
}

const OptionCard = ({
  icon,
  title,
  description,
  linkText = 'Select',
  onClick,
}: OptionCardProps) => (
  <div
    className={styles.card}
    onClick={onClick}
  >
    <div className={styles.icon}>{icon}</div>
    <span className={styles.title}>{title}</span>
    <span className={styles.description}>{description}</span>
    <span className={styles.link}>
      {linkText}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m8.25 4.5 7.5 7.5-7.5 7.5"
        />
      </svg>
    </span>
  </div>
)

export default OptionCard
