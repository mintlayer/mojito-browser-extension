import { useEffect, useState } from 'react'
import { CryptoField } from '@ComposedComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

const AmountField = ({
  amountChanged,
  transactionData,
  validity = undefined,
  errorMessage,
  exchangeRate,
  maxValueInToken,
  setAmountValidity,
  totalFeeInCrypto,
  amountInCrypto,
}) => {
  const [message, setMessage] = useState(errorMessage)

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="amount">Amount:</label>
      <CryptoField
        id="amount"
        buttonTitle="Max"
        placeholder="0.00"
        transactionData={transactionData}
        validity={validity}
        changeValueHandle={amountChanged}
        setErrorMessage={setMessage}
        inputValue={amountInCrypto}
        exchangeRate={exchangeRate}
        maxValueInToken={maxValueInToken}
        setAmountValidity={setAmountValidity}
        totalFeeInCrypto={totalFeeInCrypto}
      />
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default AmountField
