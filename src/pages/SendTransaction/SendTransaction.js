import { useContext, useState } from 'react'
import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useWalletInfo } from '@Hooks'
import { AccountContext } from '@Contexts'
import {
  BTC as BTCHelper,
  BTCTransaction as BTCTransactionHelper,
  Format,
} from '@Helpers'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const [tokenName, fiatName] = ['BTC', 'USD']
  const [totalFeeFiat, setTotalFeeFiat] = useState()
  const [totalFeeCrypto, setTotalFeeCrypto] = useState()
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { btcAddress } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)

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
    setTotalFeeFiat(Format.fiatValue(totalFee * exchangeRate))
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
            exchangeRate={exchangeRate}
            maxValueInToken={balance}
            onSendTransaction={createTransaction}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
