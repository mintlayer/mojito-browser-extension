import React, { useEffect, useState } from 'react'

import { Button, Input } from '@BasicComponents'
import { CryptoFiatField, FeeField, PopUp } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'

import SendTransactionConfirmation from './SendTransactionConfirmation'

import './SendTransaction.css'

const SendTransaction = ({
  onSendTransaction,
  transactionData,
  totalFeeFiat: totalFeeFiatParent,
  totalFeeCrypto: totalFeeCryptoParent
}) => {
  const [cryptoName] = useState(transactionData.tokenName)
  const [fiatName] = useState(transactionData.fiatName)
  const [totalFeeFiat, setTotalFeeFiat] = useState(totalFeeFiatParent)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(totalFeeCryptoParent)

  const [amountInCrypto, setAmountInCrypto] = useState('0')
  const [amountInFiat, setAmountInFiat] = useState('0.00')
  const [fee, setFee] = useState('0')
  const [addressTo, setAddressTo] = useState()

  const [openSendFundConfirmation, setOpenSendFundConfirmation] =
    useState(false)

  const FormField = ({children}) =>
    <div className="formField">{children}</div>

  const openConfirmation = () => {
    onSendTransaction({
      to: addressTo,
      amount: amountInCrypto,
      fee
    })
    setOpenSendFundConfirmation(true)
  }

  const handleConfirm = () => setOpenSendFundConfirmation(false)

  const handleCancel = () => setOpenSendFundConfirmation(false)

  useEffect(() => setTotalFeeFiat(totalFeeFiatParent), [totalFeeFiatParent])
  useEffect(() => setTotalFeeCrypto(totalFeeCryptoParent), [totalFeeCryptoParent])

  const feeChanged = (value) => setFee(value)
  const amountChanged = (amount) => {
    console.log(1)
    if (amount.currency === transactionData.tokenName) {
      setAmountInCrypto(amount.value)
      setAmountInFiat(amount.value * transactionData.exchangeRate)
      return
    }

    setAmountInFiat(amount.value)
    setAmountInCrypto(amount.value / transactionData.exchangeRate)
  }

  const addressChanged = (value) => {
    setAddressTo(value)
  }

  return (
    <>
      <FormField>
        <label htmlFor="address">Send to:</label>
        <Input
          id="address"
          placeholder="bc1.... or 1... or 3..."
          changeValueHandle={addressChanged}/>
      </FormField>
      <FormField>
        <label htmlFor="amount">Amount:</label>
        <CryptoFiatField
          id="amount"
          buttonTitle="Max"
          placeholder="0.00"
          transactionData={transactionData}
          validity={undefined}
          changeValueHandle={amountChanged}/>
      </FormField>
      <FormField>
        <label htmlFor="fee">Fee:</label>
        <FeeField
          id="fee"
          changeValueHandle={feeChanged}/>
      </FormField>

      <CenteredLayout>
        <Button
          extraStyleClasses={['send-transaction-button']}
          onClickHandle={openConfirmation}>Send</Button>
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
