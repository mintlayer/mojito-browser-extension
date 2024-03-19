import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header, CurrentStaking } from '@ComposedComponents'
import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'
import { Account } from '@Entities'
import { Format } from '@Helpers'
import { AppInfo } from '@Constants'
import { MLTransaction, ML as MLHelpers } from '@Helpers'
import { ML } from '@Cryptos'
import { Mintlayer } from '@APIs'

import './Staking.css'

const StakingPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const {
    setFeeLoading,
    transactionMode,
    delegationStep,
    setDelegationStep,
    currentDelegationInfo,
  } = useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const navigate = useNavigate()
  const tokenName = 'ML'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const goBackToWallet = () => {
    setDelegationStep(1)
    navigate('/staking')
  }
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { mlBalance } = useMlWalletInfo(currentMlAddresses)
  const delegationBalance = Format.BTCValue(
    MLHelpers.getAmountInCoins(currentDelegationInfo.balance),
  )
  const maxValueToken =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
      ? mlBalance
      : delegationBalance
  const customBackAction = () => {
    setDelegationStep(1)
    navigate('/wallet')
  }

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const mlAddressList = [
    ...currentMlAddresses.mlReceivingAddresses,
    ...currentMlAddresses.mlChangeAddresses,
  ]

  const changeAddressesLength = currentMlAddresses.mlChangeAddresses.length

  const changeAddresses = currentMlAddresses.mlChangeAddresses
  const receivingAddresses = currentMlAddresses.mlReceivingAddresses

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const amountToSend = MLHelpers.getAmountInAtoms(
      transactionInfo.amount,
    ).toString()
    const unusedChangeAddress = await ML.getUnusedAddress(changeAddresses)
    const unusedReceivingAddress = await ML.getUnusedAddress(receivingAddresses)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)
    const fee =
      transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
        ? await MLTransaction.calculateFee(
            parsedUtxos,
            undefined,
            unusedChangeAddress,
            amountToSend,
            networkType,
            undefined,
            address,
          )
        : transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
        ? await MLTransaction.calculateSpenDelegFee(
            address,
            amountToSend,
            networkType,
            currentDelegationInfo,
          )
        : await MLTransaction.calculateFee(
            parsedUtxos,
            unusedReceivingAddress,
            unusedChangeAddress,
            amountToSend,
            networkType,
            address,
          )
    const feeInCoins = MLHelpers.getAmountInCoins(fee)
    setTotalFeeFiat(Format.fiatValue(feeInCoins * exchangeRate))
    setTotalFeeCrypto(feeInCoins)
    setFeeLoading(false)
    return feeInCoins
  }

  const createTransaction = async (transactionInfo) => {
    calculateMlTotalFee(transactionInfo)
    setTransactionInformation(transactionInfo)
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

    const unusedChageAddress = await ML.getUnusedAddress(changeAddresses)
    const unusedReceivingAddress = await ML.getUnusedAddress(receivingAddresses)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)

    const result =
      transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
        ? await MLTransaction.sendTransaction(
            parsedUtxos,
            keysList,
            undefined,
            unusedChageAddress,
            amountToSend,
            networkType,
            undefined,
            transactionInformation.to,
          )
        : transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
        ? await MLTransaction.spendFromDelegation(
            keysList,
            transactionInformation.to,
            amountToSend,
            networkType,
            currentDelegationInfo,
          )
        : await MLTransaction.sendTransaction(
            parsedUtxos,
            keysList,
            unusedReceivingAddress,
            unusedChageAddress,
            '0',
            networkType,
            transactionInformation.to,
            undefined,
            transactionMode,
          )

    return result
  }

  return (
    <>
      <Header customBackAction={customBackAction} />
      {delegationStep === 1 && (
        <CurrentStaking addressList={currentMlAddresses} />
      )}
      {delegationStep === 2 && (
        <div className="page">
          <VerticalGroup>
            <SendTransaction
              totalFeeFiat={totalFeeFiat}
              totalFeeCrypto={totalFeeCrypto}
              setTotalFeeCrypto={setTotalFeeCrypto}
              transactionData={transactionData}
              exchangeRate={exchangeRate}
              maxValueInToken={maxValueToken}
              onSendTransaction={createTransaction}
              calculateTotalFee={calculateMlTotalFee}
              setFormValidity={setFormValid}
              isFormValid={isFormValid}
              confirmTransaction={confirmMlTransaction}
              goBackToWallet={goBackToWallet}
            />
          </VerticalGroup>
        </div>
      )}
    </>
  )
}

export default StakingPage
