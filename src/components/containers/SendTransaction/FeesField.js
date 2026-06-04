import { useState } from 'react'

import { FeeField, FeeFieldML } from '@ComposedComponents'

import styles from './FeesField.module.css'

const FeesField = ({
  feeChanged,
  value,
  errorMessage,
  setFeeValidity,
  walletType,
  loading,
}) => {
  const [localMessage, setLocalMessage] = useState(undefined)

  return (
    <div className={styles.field}>
      <label className={styles.label}>Network fee</label>

      {walletType && walletType.name === 'Bitcoin' ? (
        <FeeField
          id="fee"
          changeValueHandle={feeChanged}
          value={value}
          setErrorMessage={setLocalMessage}
          setFeeValidity={setFeeValidity}
        />
      ) : (
        <FeeFieldML
          id="fee"
          changeValueHandle={feeChanged}
          value={value}
          setErrorMessage={setLocalMessage}
          setFeeValidity={setFeeValidity}
          loading={loading}
        />
      )}

      {(localMessage || errorMessage) && (
        <p className={styles.errorMessage}>{localMessage ?? errorMessage}</p>
      )}
    </div>
  )
}

export default FeesField
