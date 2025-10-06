import React, { useEffect, useState, useContext } from 'react'

import { Button } from '@BasicComponents'
import { Loading, PopUp, TextField } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { BTC, Format, NumbersHelper } from '@Helpers'
import { AccountContext, MintlayerContext, TransactionContext } from '@Contexts'
import { AppInfo } from '@Constants'

import SendTransactionConfirmation from './SendTransactionConfirmation'
import AddressField from './AddressField'
import AmountField from './AmountField'
import FeesField from './FeesField'

import './SendBtcTransaction.css'
import { Error } from '@BasicComponents'

const SendBtcTransaction = ({
  totalFeeFiat,
  totalFeeCrypto,
  setTotalFeeCrypto,
  transactionData,
  exchangeRate = 0,
  maxValueInToken,
  onSendTransaction,
  calculateTotalFee,
  setFormValidity,
  isFormValid,
  confirmTransaction,
  goBackToWallet,
  preEnterAddress,
  setAdjustedFee,
  transactionMode = AppInfo.ML_TRANSACTION_MODES.TRANSACTION,
  currentDelegationInfo,
  walletType,
}) => {
  const { balanceLoading } = useContext(AccountContext)
  const { feeLoading } = useContext(TransactionContext)
  const cryptoName = transactionData.tokenName
  const fiatName = transactionData.fiatName
  const [amountInCrypto, setAmountInCrypto] = useState('0.00')
  const [amountInFiat, setAmountInFiat] = useState('0.00')
  const [originalAmount, setOriginalAmount] = useState('0,00')
  const [fee, setFee] = useState('0')
  const [addressTo, setAddressTo] = useState('')
  const [addressValidity, setAddressValidity] = useState(false)
  const [amountValidity, setAmountValidity] = useState(false)
  const [feeValidity, setFeeValidity] = useState(false)
  const [passValidity, setPassValidity] = useState(false)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [txErrorMessage, setTxErrorMessage] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const [transactionTxid, setTransactionTxid] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [askPassword, setAskPassword] = useState(false)
  const [pass, setPass] = useState(null)
  const NC = useContext(MintlayerContext)
  const loadingExtraClasses = ['loading-big']

  const [openSendFundConfirmation, setOpenSendFundConfirmation] =
    useState(false)

  const setPopupState = (state) => {
    if (transactionTxid) return
    if (sendingTransaction) return
    if (!state) setAskPassword(false)
    setPassPristinity(true)
    setPassValidity(false)
    setPass('')
    setPassErrorMessage('')
    setOpenSendFundConfirmation(state)
  }

  const openConfirmation = async () => {
    if (!isFormValid) return
    setPopupState(true)
    setTxErrorMessage('')
    onSendTransaction &&
      onSendTransaction({
        to: addressTo,
        amount: NumbersHelper.floatStringToNumber(amountInCrypto),
        fee,
      })
  }

  const sendTransaction = async (ev) => {
    ev.preventDefault()
    if (!pass) {
      setPassPristinity(false)
      setPassValidity(false)
      setPassErrorMessage('Password must be set.')
      return
    }
    setSendingTransaction(true)
    setAllowClosing(false)
    try {
      const txid = await confirmTransaction(pass)
      setTransactionTxid(txid)
      setPassValidity(true)
      setPassErrorMessage('')
      setTxErrorMessage('')
      setAskPassword(false)
      if (NC && NC.fetchAllData) {
        await NC.fetchAllData(true)
      }
    } catch (e) {
      if (e.address === '') {
        // password is not correct
        setPassErrorMessage('Incorrect password')
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setAllowClosing(true)
      } else if (typeof e === 'string' && e.includes('Invalid amount')) {
        // need to adjust fee
        setAskPassword(false)
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setTxErrorMessage('Balance is not enough to cover the transaction')
        console.error(e)
        setAllowClosing(true)
        setPopupState(false)
      } else if (e.message.includes('minimum fee')) {
        // need to adjust fee
        setAskPassword(false)
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setFee(e.message.split('minimum fee ')[1]) // Override fee with minimum fee
        setTotalFeeCrypto(e.message.split('minimum fee ')[1])
        setAdjustedFee(e.message.split('minimum fee ')[1])
        setTxErrorMessage('Transaction fee adjusted')
        console.error(e)
        setAllowClosing(true)
        setPopupState(true)
      } else {
        // handle other errors
        setAskPassword(false)
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setTxErrorMessage(e.message)
        console.error(e)
        setAllowClosing(true)
        setPopupState(false)
      }
    } finally {
      setSendingTransaction(false)
    }
  }

  const handleConfirm = async () => {
    setAskPassword(true)
  }

  const handleCancel = () => {
    setPopupState(false)
  }

  const feeChanged = (value) => setFee(value)
  const amountChanged = (amount) => {
    calculateTotalFee({
      to: addressTo,
      amount: amount.value,
      fee,
    })

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

  const changePassHandle = (value) => {
    setPass(value)
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
    const maxValue = BTC.convertBtcToSatoshi(
      NumbersHelper.floatStringToNumber(maxValueInToken),
    )
    const amount = BTC.convertBtcToSatoshi(
      NumbersHelper.floatStringToNumber(amountInCrypto),
    )
    const totalFee = BTC.convertBtcToSatoshi(totalFeeCrypto)
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

  const sendTransactionButtonTitle = 'Send'

  return (
    <div className="transaction-form">
      {balanceLoading ? (
        <div className="loading-center">
          <Loading />
        </div>
      ) : (
        <>
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
              extraStyleClasses={['send-transaction-button']}
              onClickHandle={openConfirmation}
              disabled={!isFormValid}
            >
              {sendTransactionButtonTitle}
            </Button>
          </CenteredLayout>
        </>
      )}
      {/* TODO: remove popup */}
      {openSendFundConfirmation && (
        <PopUp
          setOpen={setPopupState}
          allowClosing={allowClosing}
        >
          {!transactionTxid ? (
            sendingTransaction ? (
              <VerticalGroup bigGap>
                <h2 className="loading-text">
                  Your transaction broadcasting to network.
                </h2>
                <CenteredLayout>
                  <Loading extraStyleClasses={loadingExtraClasses} />
                </CenteredLayout>
              </VerticalGroup>
            ) : !askPassword && !feeLoading ? (
              <SendTransactionConfirmation
                address={addressTo}
                amountInFiat={amountInFiat}
                amountInCrypto={amountInCrypto}
                cryptoName={cryptoName}
                fiatName={fiatName}
                totalFeeFiat={totalFeeFiat}
                totalFeeCrypto={totalFeeCrypto}
                txErrorMessage={txErrorMessage} // TODO move update on confirmation stage
                fee={fee}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                walletType={walletType}
              ></SendTransactionConfirmation>
            ) : feeLoading ? (
              <div className="loading-center">
                <Loading />
              </div>
            ) : (
              <form onSubmit={sendTransaction}>
                <VerticalGroup bigGap>
                  <TextField
                    label="Enter your password"
                    placeHolder="Password"
                    password
                    validity={passValidity}
                    pristinity={passPristinity}
                    errorMessages={passErrorMessage}
                    onChangeHandle={changePassHandle}
                    alternate
                  />
                  <CenteredLayout>
                    <Button buttonType="submit">Send Transaction</Button>
                  </CenteredLayout>
                </VerticalGroup>
              </form>
            )
          ) : (
            <VerticalGroup bigGap>
              <h2>Your transaction was sent.</h2>
              <h3 className="result-title">Txid: {transactionTxid}</h3>
              <CenteredLayout>
                <Button onClickHandle={goBackToWallet}>
                  Back to Dashboard
                </Button>
              </CenteredLayout>
            </VerticalGroup>
          )}
        </PopUp>
      )}
    </div>
  )
}

export default SendBtcTransaction
