import React from 'react'

import styles from './SendPageHeader.module.css'

const SendPageHeader = ({ ticker, networkName, isTestnet }) => {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>
        Send <span className={styles.ticker}>{ticker}</span>
      </h1>
      <p className={styles.subtitle}>
        Transferring from your{' '}
        <strong>
          {networkName}
          {isTestnet ? ' (Testnet)' : ''}
        </strong>{' '}
        balance.
      </p>
    </div>
  )
}

export default SendPageHeader
