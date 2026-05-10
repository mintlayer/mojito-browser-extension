import { ReactComponent as ChevronIcon } from '@Assets/images/icon-chevron-down.svg'
import { APP_VERSION } from '@Version'
import { AppInfo } from '@Constants'

import styles from './SettingsAbout.module.css'

const SettingsAbout = () => {
  return (
    <>
      <div className={styles.row}>
        <span className={styles.label}>Version</span>
        <span className={styles.value}>{APP_VERSION}</span>
      </div>
      <a
        className={`${styles.row} ${styles.rowClickable}`}
        href={AppInfo.PRIVACY_POLICY_URL}
        target="_blank"
        rel="noreferrer"
      >
        <span className={styles.label}>Terms & privacy</span>
        <ChevronIcon className={styles.chevron} />
      </a>
      <a
        className={`${styles.row} ${styles.rowClickable}`}
        href={AppInfo.CONTACT_US_URL}
        target="_blank"
        rel="noreferrer"
      >
        <span className={styles.label}>Support</span>
        <ChevronIcon className={styles.chevron} />
      </a>
    </>
  )
}

export default SettingsAbout
