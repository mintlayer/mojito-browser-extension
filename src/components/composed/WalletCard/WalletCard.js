import React from 'react'

import styles from './WalletCard.module.css'

const WalletCard = ({ logo: Logo, networkName, balance }) => {
  return (
    <div className={styles.walletCard}>
      <div className={styles.walletCardLeft}>
        <div className={styles.walletCardLogo}>
          <Logo />
        </div>
        <div className={styles.walletCardInfo}>
          <span className={styles.walletCardName}>{networkName}</span>
          <span className={styles.walletCardBalance}>{balance}</span>
        </div>
      </div>
    </div>
  )
}

export default WalletCard
