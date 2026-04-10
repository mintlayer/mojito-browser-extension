import { useState } from 'react'

import { FeeField, FeeFieldML } from '@ComposedComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

const FeesField = ({
  feeChanged,
  value,
  errorMessage,
  setFeeValidity,
  walletType,
}) => {
  const [localMessage, setLocalMessage] = useState(undefined)

  return (
    <TransactionField>
      <label htmlFor="fee">Fee:</label>

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
        />
      )}

      <p className="error-message">{localMessage ?? errorMessage}</p>
    </TransactionField>
  )
}

export default FeesField
