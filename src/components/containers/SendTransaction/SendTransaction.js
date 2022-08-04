import React, { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'
import { Format } from '@Helpers'

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

  const [openSendFundConfirmation, setOpenSendFundConfirmation] =
    useState(false)

  const openConfirmation = () => {
    setOpenSendFundConfirmation(true)
    onSendTransaction &&
      onSendTransaction({
        to: addressTo,
        amount: amountInCrypto,
        fee,
      })
  }

  const handleConfirm = () => setOpenSendFundConfirmation(false)

  const handleCancel = () => setOpenSendFundConfirmation(false)

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
      setAmountInFiat((amount.value * exchangeRate).toFixed(2))
      return
    }

    setAmountInFiat(Format.fiatValue(amount.value))
    setAmountInCrypto(Format.BTCValue(amount.value / exchangeRate))
  }

  const addressChanged = (e) => {
    setAddressTo(e.target.value)
  }

  useEffect(() => {
    setFormValidity(!!(addressValidity && amountValidity && feeValidity))
  }, [addressValidity, amountValidity, feeValidity, setFormValidity])

  return (
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
        <PopUp setOpen={setOpenSendFundConfirmation}>
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
        </PopUp>
      )}
    </>
  )
}

export default SendTransaction
