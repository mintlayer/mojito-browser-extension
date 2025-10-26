import React, { useEffect, useState, useContext } from 'react'
import Decimal from 'decimal.js'

import { Button } from '@BasicComponents'
import { Loading } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'
import { Format, NumbersHelper } from '@Helpers'
import { AccountContext } from '@Contexts'
import { AppInfo } from '@Constants'
import FeesField from './FeesField'
import AddressField from './AddressField'
import AmountField from './AmountField'

import './SendMlTransaction.css'
import { Error } from '@BasicComponents'

const SendMlTransaction = ({
  totalFeeCrypto,
  feeLoading,
  transactionData,
  exchangeRate = 0,
  maxValueInToken,
  setFormValidity,
  onSendTransaction,
  confirmTransaction,
  isFormValid,
  preEnterAddress,
  transactionMode = AppInfo.ML_TRANSACTION_MODES.TRANSACTION,
  walletType,
}) => {
  const { balanceLoading } = useContext(AccountContext)
  const [amountInCrypto, setAmountInCrypto] = useState('0.00')
  const [originalAmount, setOriginalAmount] = useState('0,00')
  const [addressTo, setAddressTo] = useState('')
  const [addressValidity, setAddressValidity] = useState(false)
  const [amountValidity, setAmountValidity] = useState(false)
  const [feeValidity, setFeeValidity] = useState(false)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [txErrorMessage, setTxErrorMessage] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const loadingExtraClasses = ['loading-big']

  const sendTransaction = async (ev) => {
    ev.preventDefault()
    if (!isFormValid) return
    setSendingTransaction(true)
    try {
      await confirmTransaction()
    } catch (e) {
      setTxErrorMessage(e.message)
    } finally {
      setSendingTransaction(false)
    }
  }

  const amountChanged = (amount) => {
    if (amount.currency === transactionData.tokenName) {
      setOriginalAmount(amount.value)
      setAmountInCrypto(amount.value ? Format.BTCValue(amount.value) : '0,00')
      return
    }

    setOriginalAmount(amount.value)
    const amountDecimal = new Decimal(NumbersHelper.floatStringToNumber(amount.value) || 0)
    const exchangeRateDecimal = new Decimal(exchangeRate || 1)
    const resultDecimal = amountDecimal.div(exchangeRateDecimal)
    const formattedResult = Format.BTCValue(resultDecimal.toString())

    setAmountInCrypto(formattedResult)
  }

  const addressChanged = (e) => {
    setAddressTo(e.target.value)
  }

  useEffect(() => {
    if (preEnterAddress) {
      setAddressTo(preEnterAddress)
      setAddressValidity(true)
    }
  }, [preEnterAddress, transactionMode])

  useEffect(() => {
    setFeeValidity(true)
    if (
      (transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION ||
        transactionMode === AppInfo.ML_TRANSACTION_MODES.NFT_SEND) &&
      walletType.name === 'Mintlayer'
    ) {
      setAmountValidity(true)
    }
    setFormValidity(!!(addressValidity && amountValidity && feeValidity))
  }, [
    addressValidity,
    amountValidity,
    feeValidity,
    setFormValidity,
    transactionMode,
    walletType,
  ])

  useEffect(() => {
    const validity = originalAmount && AppInfo.amountRegex.test(originalAmount)
    const maxValueDecimal = new Decimal(NumbersHelper.floatStringToNumber(maxValueInToken) || 0)
    const amountDecimal = new Decimal(NumbersHelper.floatStringToNumber(amountInCrypto) || 0)
    const totalFeeDecimal = new Decimal(NumbersHelper.floatStringToNumber(totalFeeCrypto) || 0)

    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.NFT_SEND) {
      setAmountValidity(true)
      return
    }
    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW) {
      const maxValueLtAmount = maxValueDecimal.lt(amountDecimal)
      if (maxValueLtAmount) {
        setAmountValidity(false)
        setPassErrorMessage('Insufficient delegation balance')
        return
      }
    }
    if (!validity || amountDecimal.lte(0)) {
      setAmountValidity(false)
      return
    }
    // TODO with 22-digit numbers, this is not working
    const totalAmountDecimal = amountDecimal.plus(totalFeeDecimal)
    const insufficientFunds = totalAmountDecimal.gt(maxValueDecimal)

    if (insufficientFunds || !validity) {
      setAmountValidity(false)
      setPassErrorMessage('Insufficient funds')
    } else if (totalAmountDecimal.lte(maxValueDecimal) && validity) {
      setAmountValidity(true)
      setPassErrorMessage('')
    }
  }, [
    totalFeeCrypto,
    amountInCrypto,
    maxValueInToken,
    originalAmount,
    setAmountValidity,
    transactionMode,
  ])

  useEffect(() => {
    const amountDecimal = new Decimal(NumbersHelper.floatStringToNumber(amountInCrypto) || 0)

    onSendTransaction({
      to: addressTo,
      amount: amountDecimal.toNumber(), // Возвращаем число для совместимости
      fee: 0,
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressTo, amountInCrypto])

  const sendTransactionButtonTitle =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
      ? 'Create'
      : 'Send'

  return (
    <div className="transaction-form">
      {balanceLoading || sendingTransaction ? (
        <div className="loading-center">
          <Loading extraStyleClasses={loadingExtraClasses} />
        </div>
      ) : (
        <>
          {transactionMode === AppInfo.ML_TRANSACTION_MODES.NFT_SEND && (
            <div className="nft-transaction-info">
              <h2>Nft Id: </h2>
              <p>
                {transactionData.tokenId
                  ? transactionData.tokenId
                  : 'No NFT id'}
              </p>
            </div>
          )}
          <AddressField
            addressChanged={addressChanged}
            preEnterAddress={preEnterAddress}
            setAddressValidity={setAddressValidity}
            transactionMode={transactionMode}
            walletType={walletType}
          />

          {transactionMode !== AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
            transactionMode !== AppInfo.ML_TRANSACTION_MODES.NFT_SEND && (
              <AmountField
                transactionData={transactionData}
                amountChanged={amountChanged}
                exchangeRate={exchangeRate}
                maxValueInToken={maxValueInToken}
                setAmountValidity={setAmountValidity}
                errorMessage={passErrorMessage}
                totalFeeInCrypto={totalFeeCrypto}
                transactionMode={transactionMode}
              />
            )}

          <FeesField
            value={feeLoading ? 'calculating fee...' : totalFeeCrypto}
            walletType={walletType}
            setFeeValidity={true}
          />

          {txErrorMessage ? (
            <>
              <Error error={txErrorMessage} />
            </>
          ) : (
            <></>
          )}

          <CenteredLayout>
            <Button
              extraStyleClasses={['send-transaction-button']}
              onClickHandle={sendTransaction}
              disabled={!isFormValid || feeLoading}
            >
              {sendTransactionButtonTitle}
            </Button>
          </CenteredLayout>
        </>
      )}
    </div>
  )
}

export default SendMlTransaction
