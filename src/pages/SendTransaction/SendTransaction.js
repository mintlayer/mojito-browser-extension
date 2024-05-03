import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

import './SendTransaction.css'

const SendTransactionPage = () => {
  const { addresses, accountID, walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading } = useContext(TransactionContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [adjustedFee, setAdjustedFee] = useState(0)
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
  const { mlBalance, utxos, unusedAddresses, feerate } =
    useMlWalletInfo(currentMlAddresses)

  const maxValueToken = walletType.name === 'Mintlayer' ? mlBalance : btcBalance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const changeAddressesLength =
    currentMlAddresses && currentMlAddresses.mlChangeAddresses.length

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
    const amountToSend = MLHelpers.getAmountInAtoms(transactionInfo.amount)
    const unusedChangeAddress = unusedAddresses.change
    try {
      const transactionSize =
        await MLTransaction.calculateTransactionSizeInBytes({
          utxosTotal: utxos,
          address: address,
          changeAddress: unusedChangeAddress,
          amountToUse: amountToSend,
          network: networkType,
        })
      const fee = feerate * (transactionSize / 1000)
      const feeInCoins = MLHelpers.getAmountInCoins(Number(fee))
      setTotalFeeFiat(Format.fiatValue(feeInCoins * exchangeRate))
      setTotalFeeCrypto(feeInCoins)
      setFeeLoading(false)
      return feeInCoins
    } catch (e) {
      console.error('Error calculating fee:', e)
      goBackToWallet()
      setFeeLoading(false)
    }
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
    )
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

    const unusedChangeAddress = unusedAddresses.change

    const transactionSize = await MLTransaction.calculateTransactionSizeInBytes(
      {
        utxosTotal: utxos,
        address: transactionInformation.to,
        changeAddress: unusedChangeAddress,
        amountToUse: amountToSend,
        network: networkType,
      },
    )
    const fee = feerate * (transactionSize / 1000)

    const result = await MLTransaction.sendTransaction({
      utxosTotal: utxos,
      keysList: keysList,
      address: transactionInformation.to,
      changeAddress: unusedChangeAddress,
      amountToUse: amountToSend,
      network: networkType,
      ...(adjustedFee
        ? {
            adjustedFee: MLHelpers.getAmountInAtoms(adjustedFee),
          }
        : {
            adjustedFee: BigInt(Math.ceil(fee)),
          }),
    })
    return result
  }

  const goBackToWallet = () => navigate('/wallet/' + walletType.name)

  return (
    <>
      <div className="page">
        <VerticalGroup smallGap>
          <SendTransaction
            totalFeeFiat={totalFeeFiat}
            totalFeeCrypto={totalFeeCrypto}
            setTotalFeeCrypto={setTotalFeeCrypto}
            setAdjustedFee={setAdjustedFee}
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
