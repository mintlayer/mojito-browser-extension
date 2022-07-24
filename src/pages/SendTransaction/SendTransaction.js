import { useState } from 'react'
import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const [ totalFeeFiat, setTotalFeeFiat ] = useState()
  const [ totalFeeCrypto, setTotalFeeCrypto ] = useState()

  const transactionData = {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 22343.23,
    maxValueInToken: 450,
  }

  const createTransaction = (transactionData) => {
    console.log(transactionData)
    setTotalFeeFiat(1.00)
    setTotalFeeCrypto(0.00004320)
  }

  return (
    <>
      <Header />
      <div className="page">
        <VerticalGroup>
          <SendTransaction
            totalFeeFiat={totalFeeFiat}
            totalFeeCrypto={totalFeeCrypto}
            transactionData={transactionData}
            onSendTransaction={createTransaction}
            />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
