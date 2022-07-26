import { useState } from 'react'
import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { BTC as BTCHelper } from '@Helpers'

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
    const transactionSize = BTCHelper.calculateTransactionSizeInBytes({
      addressFrom: transactionInfo.to,
      amountToTranfer: transactionInfo.amount,
    })
    const feeInBTC = BTCHelper.formatBTCValue(
      BTCHelper.convertSatoshiToBtc(transactionInfo.fee),
    )
    const totalFee = BTCHelper.formatBTCValue(transactionSize * feeInBTC)
    setTotalFeeFiat((totalFee * transactionData.exchangeRate).toFixed(2))
    setTotalFeeCrypto(totalFee)
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
