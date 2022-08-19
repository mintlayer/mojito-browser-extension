import React, { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'
import { Loading, PopUp, TextField } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { Format, NumbersHelper } from '@Helpers'

import SendTransactionConfirmation from './SendTransactionConfirmation'
import AddressField from './AddressField'
import AmountField from './AmountField'
import FeesField from './FeesField'

import './SendTransaction.css'

const SendTransaction = ({
  onSendTransaction,
  transactionData,
  exchangeRate,
  maxValueInToken,
  totalFeeFiat: totalFeeFiatParent,
  totalFeeCrypto: totalFeeCryptoParent,
  setFormValidity,
  isFormValid,
  confirmTransaction,
  goBackToWallet,
}) => {
  const [cryptoName] = useState(transactionData.tokenName)
  const [fiatName] = useState(transactionData.fiatName)
  const [totalFeeFiat, setTotalFeeFiat] = useState(totalFeeFiatParent)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(totalFeeCryptoParent)

  const [amountInCrypto, setAmountInCrypto] = useState('0')
  const [amountInFiat, setAmountInFiat] = useState('0.00')
  const [fee, setFee] = useState('0')
  const [addressTo, setAddressTo] = useState('')
  const [addressValidity, setAddressValidity] = useState(false)
  const [amountValidity, setAmountValidity] = useState(false)
  const [feeValidity, setFeeValidity] = useState(false)
  const [passValidity, setPassValidity] = useState(false)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [sendingTransaction, setSendingTransaction] = useState(false)
  const [transactionTxid, setTransactionTxid] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [askPassword, setAskPassword] = useState(false)
  const [pass, setPass] = useState(null)

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

  const openConfirmation = () => {
    setPopupState(true)
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
      setAskPassword(false)
    } catch (e) {
      console.error(e)
      setPassPristinity(false)
      setPassValidity(false)
      setPass('')
      setPassErrorMessage('Wrong password. Account could not be unlocked')
      setAllowClosing(true)
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

  useEffect(() => setTotalFeeFiat(totalFeeFiatParent), [totalFeeFiatParent])
  useEffect(
    () => setTotalFeeCrypto(totalFeeCryptoParent),
    [totalFeeCryptoParent],
  )

  const feeChanged = (value) => setFee(value)
  const amountChanged = (amount) => {
    if (!exchangeRate) return
    if (amount.currency === transactionData.tokenName) {
      setAmountInCrypto(Format.BTCValue(amount.value))
      setAmountInFiat(
        Format.fiatValue(
          NumbersHelper.floatStringToNumber(amount.value) *
            exchangeRate.toFixed(2),
        ),
      )
      return
    }

    setAmountInFiat(Format.fiatValue(amount.value))
    setAmountInCrypto(Format.BTCValue(amount.value / exchangeRate))
  }

  const addressChanged = (e) => {
    setAddressTo(e.target.value)
  }

  const changePassHandle = (value) => {
    setPass(value)
  }

  useEffect(() => {
    setFormValidity(!!(addressValidity && amountValidity && feeValidity))
  }, [addressValidity, amountValidity, feeValidity, setFormValidity])

  return (
    <div className="transaction-form">
      <AddressField
        addressChanged={addressChanged}
        setAddressValidity={setAddressValidity}
      />

      <AmountField
        transactionData={transactionData}
        amountChanged={amountChanged}
        exchangeRate={exchangeRate}
        maxValueInToken={maxValueInToken}
        setAmountValidity={setAmountValidity}
      />

      <FeesField
        feeChanged={feeChanged}
        value="norm"
        setFeeValidity={setFeeValidity}
      />

      <CenteredLayout>
        <Button
          extraStyleClasses={['send-transaction-button']}
          onClickHandle={openConfirmation}
          disabled={!isFormValid}
        >
          Send
        </Button>
      </CenteredLayout>

      {openSendFundConfirmation && (
        <PopUp
          setOpen={setPopupState}
          allowClosing={allowClosing}
        >
          {!transactionTxid ? (
            sendingTransaction ? (
              <VerticalGroup bigGap>
                <h2>Your transaction is being created and sent.</h2>
                <div className="loading-center">
                  <Loading />
                </div>
              </VerticalGroup>
            ) : !askPassword ? (
              <SendTransactionConfirmation
                address={addressTo}
                amountInFiat={amountInFiat}
                amountInCrypto={amountInCrypto}
                cryptoName={cryptoName}
                fiatName={fiatName}
                totalFeeFiat={totalFeeFiat}
                totalFeeCrypto={totalFeeCrypto}
                fee={fee}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              ></SendTransactionConfirmation>
            ) : (
              <form>
                <VerticalGroup bigGap>
                  <TextField
                    label="Insert your password"
                    placeHolder="Password"
                    password
                    validity={passValidity}
                    pristinity={passPristinity}
                    errorMessages={passErrorMessage}
                    onChangeHandle={changePassHandle}
                  />
                  <Button onClickHandle={sendTransaction}>
                    Send Transaction
                  </Button>
                </VerticalGroup>
              </form>
            )
          ) : (
            <VerticalGroup bigGap>
              <h2>Your transaction was sent.</h2>
              <h3>txid: {transactionTxid}</h3>
              <Button onClickHandle={goBackToWallet}>Back to Wallet</Button>
            </VerticalGroup>
          )}
        </PopUp>
      )}
    </div>
  )
}

export default SendTransaction
