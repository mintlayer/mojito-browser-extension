import React, { useState } from 'react'

import { Button, Input } from '@BasicComponents'
import { CryptoFiatField, FeeField, PopUp } from '@ComposedComponents'

import SendTransactionConfirmation from './SendTransactionConfirmation'


import './SendTransaction.css'
import { CenteredLayout } from '@LayoutComponents'

const SendTransaction = () => {
  const [addressTo] = useState('mmLMRUn75mM2FC11ETfsZTtsTDUWSNa9q2')
  const [amountInFiat] = useState('0.00')
  const [amountInCrypto] = useState('0')
  const [cryptoName] = useState('BTC')
  const [fiatName] = useState('USD')
  const [totalFeeFiat] = useState('0.00')
  const [totalFeeCrypto] = useState('0')
  const [fee] = useState('0')

  const [openSendFundConfirmation, setOpenSendFundConfirmation] =
    useState(false)

  const FormField = ({children}) =>
    <div className="formField">{children}</div>

  const openConfirmation = () => setOpenSendFundConfirmation(true)

  const handleConfirm = () => setOpenSendFundConfirmation(false)

  const handleCancel = () => setOpenSendFundConfirmation(false)

  const transactionData = {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 22343.23,
    maxValueInToken: 450,
  }

  return (
    <>
      <FormField>
        <label>Send to:</label>
        <Input placeholder="bc1.... or 1... or 3..."/>
      </FormField>
      <FormField>
        <label>Amount:</label>
        <CryptoFiatField
          buttonTitle="Max"
          placeholder="0.00"
          transactionData={transactionData}
          validity={undefined}/>
      </FormField>
      <FormField>
        <label>Fee:</label>
        <FeeField value='norm'/>
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
