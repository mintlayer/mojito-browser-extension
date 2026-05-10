import React from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconSuccess } from '@Assets/images/icon-success.svg'

import styles from './RestoreSuccess.module.css'

const RestoreSuccess = () => {
  return (
    <CenteredLayout>
      <VerticalGroup bigGap>
        <div className={styles.iconCircle}>
          <IconSuccess className={styles.checkIcon} />
        </div>
        <h2 className={styles.title}>Wallet restored!</h2>
        <p className={styles.description}>
          Your wallet has been successfully restored from the backup file.
        </p>
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default RestoreSuccess
