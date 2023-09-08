import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import {
  BTC as BTCHelper,
  BTCTransaction as BTCTransactionHelper,
  Format,
  NumbersHelper,
} from '@Helpers'
import { Electrum } from '@APIs'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const { addresses, accountID, walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === 'mainnet'
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const navigate = useNavigate()
  const tokenName = walletType.name === 'Mintlayer' ? 'ML' : 'BTC'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { btcBalance } = useBtcWalletInfo(currentBtcAddress)
  const { mlBalance } = useMlWalletInfo(currentBtcAddress)

  const maxValueToken = walletType.name === 'Mintlayer' ? mlBalance : btcBalance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const calculateTotalFee = async (transactionInfo) => {
    const transactionSize =
      await BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: currentBtcAddress,
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
  }

  const createTransaction = async (transactionInfo) => {
    calculateTotalFee(transactionInfo)
    setTransactionInformation(transactionInfo)
  }

  const confirmTransaction = async (password) => {
    // eslint-disable-next-line no-unused-vars
    const { WIF } = await Account.unlockAccount(accountID, password)
    const transactionAmountInSatoshi = BTCHelper.convertBtcToSatoshi(
      transactionInformation.amount,
    )

    const transactionSize =
      await BTCTransactionHelper.calculateTransactionSizeInBytes({
        addressFrom: currentBtcAddress,
        amountToTranfer: BTCHelper.convertBtcToSatoshi(
          transactionInformation.amount,
        ),
        fee: transactionInformation.fee,
      })

    // eslint-disable-next-line no-unused-vars
    const [__, transactionHex] = await BTCTransaction.buildTransaction({
      to: transactionInformation.to,
      amount: transactionAmountInSatoshi,
      fee: transactionSize * transactionInformation.fee,
      wif: WIF,
      from: currentBtcAddress,
    })

    const result = await Electrum.broadcastTransaction(transactionHex)
    return result
  }

  const goBackToWallet = () => navigate('/wallet')

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
            maxValueInToken={maxValueToken}
            onSendTransaction={createTransaction}
            calculateTotalFee={calculateTotalFee}
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
            confirmTransaction={confirmTransaction}
            goBackToWallet={goBackToWallet}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
