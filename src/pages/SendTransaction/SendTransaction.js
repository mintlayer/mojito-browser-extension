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
  NumbersHelper,
} from '@Helpers'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const [tokenName, fiatName] = ['BTC', 'USD']
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { btcAddress } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)

  const createTransaction = async (transactionInfo) => {
    const transactionSize =
      await BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: btcAddress,
        amountToTranfer: BTCHelper.convertBtcToSatoshi(transactionInfo.amount),
        fee: transactionInfo.fee,
      })
    const feeInBTC = NumbersHelper.floatStringToNumber(
      Format.BTCValue(BTCHelper.convertSatoshiToBtc(transactionInfo.fee)),
    )

    const totalFee = NumbersHelper.floatStringToNumber(
      Format.BTCValue(transactionSize * feeInBTC),
    )

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
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
