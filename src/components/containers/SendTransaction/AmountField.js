import { useState } from 'react'
import { CryptoFiatField } from '@ComposedComponents'

import styles from './AmountField.module.css'

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
  label = 'Amount',
  children,
}) => {
  const [localMessage, setLocalMessage] = useState(undefined)

  return (
    <div className={styles.field}>
      {label && (
        <label
          className={styles.label}
          htmlFor="amount"
        >
          {label}
        </label>
      )}
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
      {(localMessage || errorMessage) && (
        <p className={styles.errorMessage}>{localMessage ?? errorMessage}</p>
      )}
    </div>
  )
}

export default AmountField
