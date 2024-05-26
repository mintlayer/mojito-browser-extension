import { useEffect, useState } from 'react'

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
  const [message, setMessage] = useState(errorMessage)

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="fee">Fee:</label>

      {walletType && walletType.name === 'Bitcoin' ? (
        <FeeField
          id="fee"
          changeValueHandle={feeChanged}
          value={value}
          setErrorMessage={setMessage}
          setFeeValidity={setFeeValidity}
        />
      ) : (
        <FeeFieldML
          id="fee"
          changeValueHandle={feeChanged}
          value={value}
          setErrorMessage={setMessage}
          setFeeValidity={setFeeValidity}
        />
      )}

      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default FeesField
