import { useEffect, useState } from 'react'

import { FeeField } from '@ComposedComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

const FeesField = ({ feeChanged, value, errorMessage }) => {

  const [ message, setMessage ] = useState(errorMessage)

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="fee">Fee:</label>
      <FeeField
        id="fee"
        changeValueHandle={feeChanged}
        value={value}
        setErrorMessage={setMessage}
      />
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default FeesField
