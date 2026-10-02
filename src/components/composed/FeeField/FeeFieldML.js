import React, { useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { ML as MLHelpers } from '@Helpers'

import styles from './FeeField.module.css'

const FeeFieldML = ({ value: parentValue, id, loading }) => {
  const { feerate } = useContext(MintlayerContext)
  const timeToFirstConfirmations = '~2 minutes'
  const feeValue = loading
    ? null
    : parentValue
      ? parentValue
      : MLHelpers.getAmountInCoins(Number(feerate / 1000))

  return (
    <div
      className={styles.tiers}
      id={id}
    >
      <button
        type="button"
        className={`${styles.tierCard} ${styles.tierCardSelected} ${loading ? styles.tierCardLoading : ''}`}
        disabled
      >
        <span className={`${styles.tierLabel} ${styles.tierLabelSelected}`}>
          Network fee
        </span>
        <span className={styles.tierTime}>{timeToFirstConfirmations}</span>
        <span className={styles.tierFee}>
          {loading ? 'calculating...' : `${feeValue} ML`}
        </span>
      </button>
    </div>
  )
}

export default FeeFieldML
