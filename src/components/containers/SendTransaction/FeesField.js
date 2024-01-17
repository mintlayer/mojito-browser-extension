import { useEffect, useState, useContext } from 'react'

import { FeeField } from '@ComposedComponents'
import TransactionField from './TransactionField'
import { AccountContext } from '@Contexts'

import './errorMessages.css'

const FeesField = ({ feeChanged, value, errorMessage, setFeeValidity }) => {
  const { walletType } = useContext(AccountContext)
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
        <p>The final fee will be calculated at the next step</p>
      )}

      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default FeesField
