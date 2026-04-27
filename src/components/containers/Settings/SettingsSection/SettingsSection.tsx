import { ReactNode } from 'react'
import styles from './SettingsSection.module.css'

interface SettingsSectionProps {
  title: string
  children: ReactNode
}

const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  return (
    <div className={styles.section}>
      <p className={styles.label}>{title}</p>
      <div className={styles.card}>{children}</div>
    </div>
  )
}

const SettingsItem = ({ children }: { children: ReactNode }) => {
  return <div className={styles.item}>{children}</div>
}

SettingsSection.Item = SettingsItem

export default SettingsSection
