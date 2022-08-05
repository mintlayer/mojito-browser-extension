import { useContext, useState } from 'react'
import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useWalletInfo } from '@Hooks'
import { AccountContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import {
  BTC as BTCHelper,
  BTCTransaction as BTCTransactionHelper,
  Format,
  NumbersHelper,
} from '@Helpers'

import './SendTransaction.css'
import { Electrum } from '@APIs'

const SendTransactionPage = () => {
  const [tokenName, fiatName] = ['BTC', 'USD']
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { btcAddress, accountID } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)

  const createTransaction = async (transactionInfo) => {
    const transactionSize =
      await BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: btcAddress,
        amountToTranfer: BTCHelper.convertBtcToSatoshi(transactionInfo.amount),
        fee: transactionInfo.fee,
      })

    const totalFee = NumbersHelper.floatStringToNumber(
      Format.BTCValue(
        BTCHelper.convertSatoshiToBtc(transactionSize * transactionInfo.fee),
      ),
    )

    setTotalFeeFiat(Format.fiatValue(totalFee * exchangeRate))
    setTotalFeeCrypto(totalFee)
    setTransactionInformation(transactionInfo)
  }

  const confirmTransaction = async (password = 'Qq@1poiu') => {
    console.log(accountID)

    // eslint-disable-next-line no-unused-vars
    const [_, WIF] = await Account.unlockAccount(accountID, password)

    const transactionSize =
      await BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: btcAddress,
        amountToTranfer: BTCHelper.convertBtcToSatoshi(
          transactionInformation.amount,
        ),
        fee: transactionInformation.fee,
      })

    // eslint-disable-next-line no-unused-vars
    const [__, transactionHex] = await BTCTransaction.buildTransaction({
      to: transactionInformation.to,
      amount: BTCHelper.convertBtcToSatoshi(transactionInformation.amount),
      fee: transactionSize * transactionInformation.fee,
      wif: WIF,
      from: btcAddress,
    })

    const result = await Electrum.broadcastTransaction(transactionHex)
    return result
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
            confirmTransaction={confirmTransaction}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
