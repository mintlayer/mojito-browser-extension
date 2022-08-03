import { useEffect, useState } from 'react'
import { CryptoFiatField } from '@ComposedComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

const AmountField = ({
  amountChanged,
  transactionData,
  validity = undefined,
  errorMessage,
  exchangeRate,
  maxValueInToken,
}) => {
  const [message, setMessage] = useState(errorMessage)

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="amount">Amount:</label>
      <CryptoFiatField
        id="amount"
        buttonTitle="Max"
        placeholder="0"
        transactionData={transactionData}
        validity={validity}
        changeValueHandle={amountChanged}
        setErrorMessage={setMessage}
        exchangeRate={exchangeRate}
        maxValueInToken={maxValueInToken}
      />
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default AmountField
