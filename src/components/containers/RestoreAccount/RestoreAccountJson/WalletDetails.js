import React from 'react'

import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { ReactComponent as IconAccount } from '@Assets/images/icon-account.svg'
import { ReactComponent as IconWallet } from '@Assets/images/icon-wallet.svg'
import { ReactComponent as IconInbox } from '@Assets/images/icon-inbox.svg'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'

import styles from './WalletDetails.module.css'

const WalletDetails = ({ fileContent }) => {
  const details = [
    { label: 'Wallet Name', value: fileContent?.name, icon: <IconAccount /> },
    { label: 'Wallet ID', value: `#${fileContent?.id}`, icon: <IconWallet /> },
    {
      label: 'Assets',
      value: fileContent?.walletsToCreate,
      icon: <IconInbox />,
    },
  ]

  return (
    <CenteredLayout>
      <VerticalGroup>
        <h2 className={styles.title}>Confirm wallet details</h2>
        <p className={styles.subtitle}>
          Review the information from your backup file
        </p>
        <div className={styles.detailsCard}>
          {details.map((item, index) => {
            const content = Array.isArray(item.value)
              ? item.value.join(', ').toUpperCase()
              : item.value
            return (
              <div
                key={index}
                className={styles.detailsRow}
              >
                <div className={styles.detailsIcon}>{item.icon}</div>
                <div>
                  <p className={styles.detailsLabel}>{item.label}</p>
                  <p className={styles.detailsValue}>{content}</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className={styles.infoBanner}>
          <div className={styles.infoBannerIcon}>
            <IconShield />
          </div>
          <p className={styles.infoBannerText}>
            You&apos;ll need your password to unlock this wallet after
            restoring.
          </p>
        </div>
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default WalletDetails
