import React, { useState } from 'react'

import { PopUp } from '@ComposedComponents'

import SendTransactionConfirmation from './SendTransactionConfirmation'
import { Button } from '@BasicComponents'

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

  const openConfirmation = () => setOpenSendFundConfirmation(true)

  const handleConfirm = () => setOpenSendFundConfirmation(false)

  const handleCancel = () => setOpenSendFundConfirmation(false)

  return (
    <>
      <Button onClickHandle={openConfirmation}>Send</Button>
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
