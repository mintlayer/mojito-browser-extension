import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import {
  BTC as BTCHelper,
  BTCTransaction as BTCTransactionHelper,
  Format,
  NumbersHelper,
} from '@Helpers'
import { Electrum } from '@APIs'
import { AppInfo } from '@Constants'
import { MLTransaction, ML as MLHelpers } from '@Helpers'
import { ML } from '@Cryptos'
import { Mintlayer } from '@APIs'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const { addresses, accountID, walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading, transactionMode } = useContext(TransactionContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses
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
  const { mlBalance } = useMlWalletInfo(currentMlAddresses)

  const maxValueToken = walletType.name === 'Mintlayer' ? mlBalance : btcBalance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const mlAddressList = currentMlAddresses && [
    ...currentMlAddresses.mlReceivingAddresses,
    ...currentMlAddresses.mlChangeAddresses,
  ]

  const changeAddressesLength =
    currentMlAddresses && currentMlAddresses.mlChangeAddresses.length

  const changeAddress =
    currentMlAddresses && currentMlAddresses.mlChangeAddresses

  const calculateBtcTotalFee = async (transactionInfo) => {
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

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const amountToSend = MLHelpers.getAmountInAtoms(
      transactionInfo.amount,
    ).toString()
    const unusedChangeAddress = await ML.getUnusedAddress(changeAddress)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)
    const fee = await MLTransaction.calculateFee(
      parsedUtxos,
      address,
      unusedChangeAddress,
      amountToSend,
      networkType,
    )
    const feeInCoins = MLHelpers.getAmountInCoins(fee)
    setTotalFeeFiat(Format.fiatValue(feeInCoins * exchangeRate))
    setTotalFeeCrypto(feeInCoins)
    setFeeLoading(false)
    return feeInCoins
  }

  const createTransaction = async (transactionInfo) => {
    walletType.name === 'Bitcoin'
      ? calculateBtcTotalFee(transactionInfo)
      : calculateMlTotalFee(transactionInfo)
    setTransactionInformation(transactionInfo)
  }

  const confirmBtcTransaction = async (password) => {
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

  const confirmMlTransaction = async (password) => {
    const amountToSend = MLHelpers.getAmountInAtoms(
      transactionInformation.amount,
    ).toString()
    const { mlPrivKeys } = await Account.unlockAccount(accountID, password)
    const privKey =
      networkType === 'mainnet'
        ? mlPrivKeys.mlMainnetPrivateKey
        : mlPrivKeys.mlTestnetPrivateKey

    const walletPrivKeys = await ML.getWalletPrivKeysList(
      privKey,
      networkType,
      changeAddressesLength,
    )
    const keysList = {
      ...walletPrivKeys.mlReceivingPrivKeys,
      ...walletPrivKeys.mlChangePrivKeys,
    }

    const unusedChageAddress = await ML.getUnusedAddress(changeAddress)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)
    const result = await MLTransaction.sendTransaction(
      parsedUtxos,
      keysList,
      transactionInformation.to,
      unusedChageAddress,
      amountToSend,
      networkType,
    )
    return result
  }

  const goBackToWallet = () => {
    transactionMode === 'delegation' ? navigate('/staking') : navigate('/wallet')
  }

  return (
    <>
      <Header />
      <div className="page">
        <VerticalGroup smallGap>
          <SendTransaction
            totalFeeFiat={totalFeeFiat}
            totalFeeCrypto={totalFeeCrypto}
            setTotalFeeCrypto={setTotalFeeCrypto}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueToken}
            onSendTransaction={createTransaction}
            calculateTotalFee={
              walletType.name === 'Mintlayer'
                ? calculateMlTotalFee
                : calculateBtcTotalFee
            }
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
            confirmTransaction={
              walletType.name === 'Mintlayer'
                ? confirmMlTransaction
                : confirmBtcTransaction
            }
            goBackToWallet={goBackToWallet}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
