import { useState } from 'react'
import { CryptoFiatField } from '@ComposedComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

const AmountField = ({
  amountChanged,
  transactionData,
  validity = undefined,
  errorMessage,
  maxValueInToken,
  setAmountValidity,
  totalFeeInCrypto,
  transactionMode,
  inputValue,
  placeholder,
  validate,
  label = 'Amount:',
  children,
}) => {
  const [localMessage, setLocalMessage] = useState(undefined)

  return (
    <TransactionField>
      {label && <label htmlFor="amount">{label}</label>}
      <CryptoFiatField
        id="amount"
        buttonTitle="Max"
        placeholder={placeholder || '0'}
        transactionData={transactionData}
        inputValue={inputValue}
        validity={validity}
        changeValueHandle={amountChanged}
        setErrorMessage={setLocalMessage}
        maxValueInToken={maxValueInToken}
        setAmountValidity={setAmountValidity}
        totalFeeInCrypto={totalFeeInCrypto}
        transactionMode={transactionMode}
        validate={validate}
      />
      {children}
      <p className="error-message">{localMessage ?? errorMessage}</p>
    </TransactionField>
  )
}

export default AmountField
