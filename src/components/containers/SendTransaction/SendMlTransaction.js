import React, { useEffect, useState, useContext } from 'react'

import { Button } from '@BasicComponents'
import { Loading } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'
import { BTC, Format, NumbersHelper } from '@Helpers'
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
  currentDelegationInfo,
  walletType,
}) => {
  const { balanceLoading } = useContext(AccountContext)
  const [amountInCrypto, setAmountInCrypto] = useState('0.00')
  const [amountInFiat, setAmountInFiat] = useState('0.00')
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
      setAmountInFiat(
        Format.fiatValue(
          NumbersHelper.floatStringToNumber(amount.value) *
            exchangeRate.toFixed(2),
        ),
      )
      return
    }
    setOriginalAmount(amount.value)
    setAmountInFiat(Format.fiatValue(amount.value))
    setAmountInCrypto(
      Format.BTCValue(
        NumbersHelper.floatStringToNumber(amount.value) / exchangeRate,
      ),
    )
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
    const maxValue = BTC.convertBtcToSatoshi(
      NumbersHelper.floatStringToNumber(maxValueInToken),
    )
    const amount = BTC.convertBtcToSatoshi(
      NumbersHelper.floatStringToNumber(amountInCrypto),
    )
    const totalFee = BTC.convertBtcToSatoshi(totalFeeCrypto)
    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.NFT_SEND) {
      setAmountValidity(true)
      return
    }
    if (!validity || amount <= 0) {
      setAmountValidity(false)
      return
    }
    // TODO with 22-digit numbers, this is not working
    if (amount + totalFee > maxValue || !validity) {
      setAmountValidity(false)
      setPassErrorMessage('Insufficient funds')
    } else if (amount + totalFee <= maxValue && validity) {
      setAmountValidity(true)
      setPassErrorMessage('')
    }
  }, [
    totalFeeCrypto,
    amountInCrypto,
    maxValueInToken,
    amountInFiat,
    originalAmount,
    setAmountValidity,
    transactionMode,
  ])

  useEffect(() => {
    onSendTransaction({
      to: addressTo,
      amount: NumbersHelper.floatStringToNumber(amountInCrypto),
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
            currentDelegationInfo={currentDelegationInfo}
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
