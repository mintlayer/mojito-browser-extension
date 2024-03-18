import { useEffect, useState, useContext } from 'react'
import { CryptoFiatField } from '@ComposedComponents'
import TransactionField from './TransactionField'
import { AppInfo } from '@Constants'

import { TransactionContext, AccountContext } from '@Contexts'

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
}) => {
  const { walletType } = useContext(AccountContext)
  const { transactionMode } = useContext(TransactionContext)
  const isDelegationMode =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
    walletType.name === 'Mintlayer'
  const [message, setMessage] = useState(errorMessage)

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="amount">{isDelegationMode ? '' : 'Amount:'}</label>
      {isDelegationMode ? (
        <p className="delegation-description">
          To create a new delegation, you first need to send a zero-sum
          transaction to the blockchain. After the transaction is complete,
          please return to the "Staking" section and add funds to your newly
          created delegation.
        </p>
      ) : (
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
          setAmountValidity={setAmountValidity}
          totalFeeInCrypto={totalFeeInCrypto}
        />
      )}
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default AmountField
