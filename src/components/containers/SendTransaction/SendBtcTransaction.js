import React, { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router'
import Decimal from 'decimal.js'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'

import { Button } from '@BasicComponents'
import { Loading, WalletCard } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'
import { BTC, Format, NumbersHelper } from '@Helpers'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import AddressField from './AddressField'
import AmountField from './AmountField'
import FeesField from './FeesField'

import styles from './SendBtcTransaction.module.css'
import { Error } from '@BasicComponents'

const SendBtcTransaction = ({
  totalFeeCrypto,
  transactionData,
  exchangeRate = 0,
  maxValueInToken,
  onSendTransaction,
  calculateTotalFee,
  setFormValidity,
  isFormValid,
  preEnterAddress,
  transactionMode = AppInfo.ML_TRANSACTION_MODES.TRANSACTION,
  currentDelegationInfo,
  walletType,
}) => {
  const { balanceLoading } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const [amountInCrypto, setAmountInCrypto] = useState('0.00')
  const [amountInFiat, setAmountInFiat] = useState('0.00')
  const [originalAmount, setOriginalAmount] = useState('0,00')
  const [fee, setFee] = useState('0')
  const [addressTo, setAddressTo] = useState('')
  const [addressValidity, setAddressValidity] = useState(false)
  const [amountValidity, setAmountValidity] = useState(false)
  const [feeValidity, setFeeValidity] = useState(false)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [txErrorMessage, setTxErrorMessage] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const navigate = useNavigate()

  const openConfirmation = async () => {
    if (!isFormValid || sendingTransaction) return
    setSendingTransaction(true)
    setTxErrorMessage('')

    try {
      const amount = NumbersHelper.floatStringToNumber(amountInCrypto)
      const fees =
        onSendTransaction &&
        (await onSendTransaction({ to: addressTo, amount, fee }))

      if (!fees) return

      navigate('confirm', {
        state: {
          address: addressTo,
          amountInCrypto,
          amountInFiat,
          fee,
          totalFeeFiat: fees.totalFeeFiat,
          totalFeeCrypto: fees.totalFeeCrypto,
          walletType,
          transactionAmount: amount,
        },
      })
    } catch (e) {
      setTxErrorMessage(e?.message || String(e))
    } finally {
      setSendingTransaction(false)
    }
  }

  const feeChanged = (value) => setFee(value)
  const amountChanged = (amount) => {
    calculateTotalFee({
      to: addressTo,
      amount: amount.value,
      fee,
    })

    const exchangeRateDecimal = new Decimal(exchangeRate || 0)
    if (!exchangeRateDecimal.gt(0)) {
      setPassErrorMessage('Exchange rate is unavailable. Please try again.')
      return
    }

    if (amount.currency === transactionData.tokenName) {
      setOriginalAmount(amount.value)
      setAmountInCrypto(amount.value ? Format.BTCValue(amount.value) : '0,00')
      setAmountInFiat(
        Format.fiatValue(
          exchangeRateDecimal
            .times(NumbersHelper.floatStringToNumber(amount.value) || 0)
            .toString(),
        ),
      )
      return
    }

    setOriginalAmount(amount.value)
    setAmountInFiat(Format.fiatValue(amount.value))
    setAmountInCrypto(
      Format.BTCValue(
        new Decimal(NumbersHelper.floatStringToNumber(amount.value) || 0)
          .div(exchangeRateDecimal)
          .toString(),
      ),
    )
  }

  const addressChanged = (e) => {
    setAddressTo(e.target.value)
  }

  useEffect(() => {
    setFormValidity(!!(addressValidity && amountValidity && feeValidity))
  }, [
    addressValidity,
    amountValidity,
    feeValidity,
    setFormValidity,
    transactionMode,
    walletType,
  ])

  useEffect(
    () => {
      if (fee && amountInCrypto) {
        calculateTotalFee({
          amount: NumbersHelper.floatStringToNumber(amountInCrypto),
          fee,
        })
      } else {
        return
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fee, amountInCrypto],
  )

  useEffect(() => {
    const validity = originalAmount && AppInfo.amountRegex.test(originalAmount)
    const maxValue = new Decimal(
      BTC.convertBtcToSatoshi(
        NumbersHelper.floatStringToNumber(maxValueInToken) || 0,
      ),
    )
    const amount = new Decimal(
      BTC.convertBtcToSatoshi(
        NumbersHelper.floatStringToNumber(amountInCrypto) || 0,
      ),
    )
    const totalFee = new Decimal(BTC.convertBtcToSatoshi(totalFeeCrypto || 0))
    if (!validity || amount.lte(0)) {
      setAmountValidity(false)
      return
    }
    const totalAmount = amount.plus(totalFee)
    if (totalAmount.gt(maxValue)) {
      setAmountValidity(false)
      setPassErrorMessage('Insufficient funds')
    } else if (totalAmount.lte(maxValue) && validity) {
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

  const sendTransactionButtonTitle = 'Send'

  return (
    <div className={styles.transactionForm}>
      {balanceLoading ? (
        <div className={styles.loadingCenter}>
          <Loading />
        </div>
      ) : (
        <>
          <WalletCard
            logo={BtcLogo}
            networkName={`Bitcoin${isTestnet ? ' (Testnet)' : ''}`}
            balance={`Balance: ${Format.BTCValue(maxValueInToken)} BTC`}
          />

          <AddressField
            addressChanged={addressChanged}
            preEnterAddress={preEnterAddress}
            setAddressValidity={setAddressValidity}
            transactionMode={transactionMode}
            currentDelegationInfo={currentDelegationInfo}
            walletType={walletType}
          />

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

          {/* TODO style error from transaction */}
          <FeesField
            feeChanged={feeChanged}
            value={'norm'}
            setFeeValidity={setFeeValidity}
            walletType={walletType}
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
              extraStyleClasses={[styles.sendTransactionButton]}
              onClickHandle={openConfirmation}
              disabled={!isFormValid || sendingTransaction}
            >
              {sendTransactionButtonTitle}
            </Button>
          </CenteredLayout>
        </>
      )}
    </div>
  )
}

export default SendBtcTransaction
