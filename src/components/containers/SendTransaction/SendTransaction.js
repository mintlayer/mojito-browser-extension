import React, { useEffect, useState, useContext } from 'react'

import { Button } from '@BasicComponents'
import { Loading, PopUp, TextField } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { BTC, Format, NumbersHelper } from '@Helpers'
import { AccountContext } from '@Contexts'
import { AppInfo } from '@Constants'

import SendTransactionConfirmation from './SendTransactionConfirmation'
import AddressField from './AddressField'
import AmountField from './AmountField'
import FeesField from './FeesField'

import './SendTransaction.css'
import { Error } from '@BasicComponents'

const SendTransaction = ({
  totalFeeFiat: totalFeeFiatParent,
  totalFeeCrypto: totalFeeCryptoParent,
  setTotalFeeCrypto: setTotalFeeCryptoParent,
  transactionData,
  exchangeRate,
  maxValueInToken,
  onSendTransaction,
  calculateTotalFee,
  setFormValidity,
  isFormValid,
  confirmTransaction,
  goBackToWallet,
}) => {
  const { walletType, balanceLoading, feeLoading } = useContext(AccountContext)
  const [cryptoName] = useState(transactionData.tokenName)
  const [fiatName] = useState(transactionData.fiatName)
  const [totalFeeFiat, setTotalFeeFiat] = useState(totalFeeFiatParent)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(totalFeeCryptoParent)
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
  const isBitcoinWallet = walletType.name === 'Bitcoin'

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
    // setTxErrorMessage('')
    setOpenSendFundConfirmation(state)
  }

  const openConfirmation = async () => {
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
      setTxErrorMessage('')
      setAskPassword(false)
    } catch (e) {
      if (e.address === '') {
        // password is not correct
        setPassErrorMessage('Incorrect password')
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setAllowClosing(true)
      } else {
        // handle other errors
        setAskPassword(false)
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setTxErrorMessage(e.message)
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
    if (walletType.name === 'Mintlayer') {
      setTotalFeeCryptoParent(0)
    }
  }

  useEffect(() => setTotalFeeFiat(totalFeeFiatParent), [totalFeeFiatParent])
  useEffect(
    () => setTotalFeeCrypto(totalFeeCryptoParent),
    [totalFeeCryptoParent],
  )

  const feeChanged = (value) => setFee(value)
  const amountChanged = (amount) => {
    // TODO process this when/if we will have currency switcher
    // if (!exchangeRate) return
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
    if (!isBitcoinWallet) setFeeValidity(true)
    setFormValidity(!!(addressValidity && amountValidity && feeValidity))
  }, [
    addressValidity,
    amountValidity,
    feeValidity,
    setFormValidity,
    isBitcoinWallet,
  ])

  useEffect(
    () => {
      if (fee && amountInCrypto && isBitcoinWallet) {
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
  ])

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
            setAddressValidity={setAddressValidity}
          />

          <AmountField
            transactionData={transactionData}
            amountChanged={amountChanged}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueInToken}
            setAmountValidity={setAmountValidity}
            errorMessage={passErrorMessage}
            totalFeeInCrypto={totalFeeCrypto}
          />

          {/* TODO style error from transaction */}
          <FeesField
            feeChanged={feeChanged}
            value="norm"
            setFeeValidity={setFeeValidity}
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
              Send
            </Button>
          </CenteredLayout>
        </>
      )}

      {openSendFundConfirmation && (
        <PopUp
          setOpen={setPopupState}
          allowClosing={allowClosing}
        >
          {!transactionTxid ? (
            sendingTransaction ? (
              <VerticalGroup bigGap>
                <h2>Your transaction broadcasting to network.</h2>
                <div className="loading-center">
                  <Loading />
                </div>
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
                // txErrorMessage={txErrorMessage} // TODO move update on confirmation stage
                fee={fee}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              ></SendTransactionConfirmation>
            ) : feeLoading ? (
              <div className="loading-center">
                <Loading />
              </div>
            ) : (
              <form>
                <VerticalGroup bigGap>
                  <TextField
                    label="Enter your password"
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
              <h3 className="result-title">Txid: {transactionTxid}</h3>
              <Button onClickHandle={goBackToWallet}>Back to Wallet</Button>
            </VerticalGroup>
          )}
        </PopUp>
      )}
    </div>
  )
}

export default SendTransaction
