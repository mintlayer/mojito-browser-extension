import { useState } from 'react'
import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import {
  BTC as BTCHelper,
  BTCTransaction as BTCTransactionHelper,
  Format,
} from '@Helpers'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const [totalFeeFiat, setTotalFeeFiat] = useState()
  const [totalFeeCrypto, setTotalFeeCrypto] = useState()

  const transactionData = {
    fiatName: 'USD',
    tokenName: 'BTC',
    exchangeRate: 22343.23,
    maxValueInToken: 450,
  }

  const createTransaction = (transactionInfo) => {
    const transactionSize =
      BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: transactionInfo.to,
        amountToTranfer: transactionInfo.amount,
      })
    const feeInBTC = Format.BTCValue(
      BTCHelper.convertSatoshiToBtc(transactionInfo.fee),
    )
    const totalFee = Format.BTCValue(transactionSize * feeInBTC)
    setTotalFeeFiat(Format.fiatValue(totalFee * transactionData.exchangeRate))
    setTotalFeeCrypto(totalFee)
  }

  return (
    <>
      <Header />
      <div className="page">
        <VerticalGroup smallGap>
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
