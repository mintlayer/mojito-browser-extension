import React, { useEffect, useState, useContext } from 'react'
import Decimal from 'decimal.js'
import { ReactComponent as MlLogo } from '@Assets/images/logo.svg'

import { Button } from '@BasicComponents'
import { Loading, WalletCard } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'
import { Format, NumbersHelper, ML } from '@Helpers'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import FeesField from './FeesField'
import AddressField from './AddressField'
import AmountField from './AmountField'

import styles from './SendMlTransaction.module.css'
import { Error } from '@BasicComponents'

const SendMlTransaction = ({
  totalFeeCrypto,
  feeLoading,
  feeError,
  transactionData,
  exchangeRate = 0,
  maxValueInToken,
  // ML coin balance: the network fee is paid in ML coins even when the
  // transfer itself spends a token balance.
  mlCoinBalance = 0,
  // True while the provider is fetching balances: the fee-vs-ML check is
  // skipped so a fetch starting from the 0 default cannot flash a false
  // 'Insufficient ML balance' before the real balance arrives.
  mlBalanceLoading = false,
  setFormValidity,
  onSendTransaction,
  confirmTransaction,
  isFormValid,
  preEnterAddress,
  transactionMode = AppInfo.ML_TRANSACTION_MODES.TRANSACTION,
  walletType,
  decimals = AppInfo.ML_DECIMALS,
}) => {
  const { balanceLoading } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
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
      setTxErrorMessage(e?.message || String(e))
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
    const amountDecimal = new Decimal(
      NumbersHelper.floatStringToNumber(amount.value) || 0,
    )
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
      const validity =
        transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
          ? ML.isMlPoolIdValid(preEnterAddress, networkType)
          : transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING ||
              transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
            ? ML.isMlDelegationIdValid(preEnterAddress, networkType)
            : ML.isMlAddressValid(preEnterAddress, networkType)
      setAddressValidity(validity)
    }
  }, [preEnterAddress, transactionMode, networkType])

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
    const maxValueDecimal = new Decimal(
      NumbersHelper.floatStringToNumber(maxValueInToken) || 0,
    )
    const amountDecimal = new Decimal(
      NumbersHelper.floatStringToNumber(amountInCrypto) || 0,
    )
    const totalFeeDecimal = new Decimal(
      NumbersHelper.floatStringToNumber(totalFeeCrypto) || 0,
    )

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
      if (!validity || amountDecimal.lte(0)) {
        setAmountValidity(false)
        return
      }
      setAmountValidity(true)
      setPassErrorMessage('')
      return
    }
    if (!validity || amountDecimal.lte(0)) {
      setAmountValidity(false)
      return
    }

    // Token transfers spend two balances in different units: the amount
    // comes off the token balance while the network fee is paid in ML
    // coins. Summing amount + fee and comparing against one balance mixes
    // the units, so each side is checked against its own balance.
    if (walletType?.tokenId) {
      if (amountDecimal.gt(maxValueDecimal)) {
        setAmountValidity(false)
        setPassErrorMessage('Insufficient token balance')
        return
      }
      const mlBalanceDecimal = new Decimal(
        NumbersHelper.floatStringToNumber(mlCoinBalance) || 0,
      )
      if (!mlBalanceLoading && totalFeeDecimal.gt(mlBalanceDecimal)) {
        setAmountValidity(false)
        setPassErrorMessage('Insufficient ML balance for the transaction fee')
        return
      }
      setAmountValidity(true)
      setPassErrorMessage('')
      return
    }

    // Coin sends spend amount and fee from the same ML balance, so the
    // combined check is unit-safe.
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
    mlCoinBalance,
    mlBalanceLoading,
    walletType,
    originalAmount,
    setAmountValidity,
    transactionMode,
  ])

  useEffect(() => {
    const amountDecimal = new Decimal(
      NumbersHelper.floatStringToNumber(amountInCrypto) || 0,
    )
    if (
      !addressTo ||
      (transactionMode !== AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
        transactionMode !== AppInfo.ML_TRANSACTION_MODES.NFT_SEND &&
        amountDecimal.lte(0))
    )
      return

    onSendTransaction({
      to: addressTo,
      amount: amountDecimal.toNumber(),
      fee: 0,
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressTo, amountInCrypto])

  const sendTransactionButtonTitle =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
      ? 'Create'
      : 'Send'

  return (
    <div className={styles.transactionForm}>
      {balanceLoading || sendingTransaction ? (
        <div className={styles.loadingCenter}>
          <Loading extraStyleClasses={loadingExtraClasses} />
        </div>
      ) : (
        <>
          <WalletCard
            logo={MlLogo}
            networkName={`Mintlayer${isTestnet ? ' (Testnet)' : ''}`}
            balance={`Balance: ${Format.BTCValue(maxValueInToken)} ${transactionData.tokenName}`}
          />

          {transactionMode === AppInfo.ML_TRANSACTION_MODES.NFT_SEND && (
            <div className={styles.nftTransactionInfo}>
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
                errorMessage={feeError || passErrorMessage}
                totalFeeInCrypto={totalFeeCrypto}
                transactionMode={transactionMode}
                decimals={decimals}
                feeCurrencyDiffers={!!walletType?.tokenId}
              />
            )}

          <FeesField
            value={feeLoading ? 'calculating fee...' : totalFeeCrypto}
            walletType={walletType}
            setFeeValidity={true}
            loading={feeLoading}
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
