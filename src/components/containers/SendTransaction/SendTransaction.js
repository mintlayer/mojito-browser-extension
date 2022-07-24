import React, { useEffect, useState } from 'react'

import { Button } from '@BasicComponents'
import { PopUp } from '@ComposedComponents'
import { CenteredLayout } from '@LayoutComponents'

import SendTransactionConfirmation from './SendTransactionConfirmation'
import AddressField from './AddressField'
import AmountField from './AmountField'
import FeesField from './FeesField'

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
  const [addressTo, setAddressTo] = useState('')

  const [openSendFundConfirmation, setOpenSendFundConfirmation] =
    useState(false)

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
    if (amount.currency === transactionData.tokenName) {
      setAmountInCrypto(amount.value)
      setAmountInFiat(amount.value * transactionData.exchangeRate)
      return
    }

    setAmountInFiat(amount.value)
    setAmountInCrypto(amount.value / transactionData.exchangeRate)
  }

  const addressChanged = (e) => {
    setAddressTo(e.target.value)
  }

  return (
    <>
      <AddressField
        addressChanged={addressChanged} />

      <AmountField
        transactionData={transactionData}
        amountChanged={amountChanged} />

      <FeesField
        feeChanged={feeChanged} />

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
