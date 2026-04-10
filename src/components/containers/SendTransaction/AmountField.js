import { useState } from 'react'
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
  setAmountValidity,
  totalFeeInCrypto,
  transactionMode,
}) => {
  const [localMessage, setLocalMessage] = useState(undefined)

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
        setErrorMessage={setLocalMessage}
        exchangeRate={exchangeRate}
        maxValueInToken={maxValueInToken}
        setAmountValidity={setAmountValidity}
        totalFeeInCrypto={totalFeeInCrypto}
        transactionMode={transactionMode}
      />
      <p className="error-message">{localMessage ?? errorMessage}</p>
    </TransactionField>
  )
}

export default AmountField
