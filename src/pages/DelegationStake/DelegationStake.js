import { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { Header } from '@ComposedComponents'
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

import './DelegationStake.css'

const DelegationStakePage = () => {
  const { state } = useLocation()
  const { coinType, delegationId } = useParams()

  const walletType = {
    name: coinType,
  }

  const currentDelegationInfo = {
    delegation_id: delegationId,
    balance: 0,
  }

  const transactionMode = AppInfo.ML_TRANSACTION_MODES.STAKING

  const { addresses, accountID, setWalletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const {
    setFeeLoading,
    setDelegationStep,
    setTransactionMode,
  } = useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [preEnterAddress, setPreEnterAddress] = useState(null)
  const navigate = useNavigate()
  const tokenName = 'ML'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const goBackToWallet = () => {
    setDelegationStep(1)
    navigate('/wallet/' + walletType.name + '/staking')
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
  // const customBackAction = () => {
  //   setDelegationStep(1)
  //   navigate('/wallet')
  // }

  useEffect(() => {
    if (state && state.action === 'createDelegate') {
      setDelegationStep(2)
      setTransactionMode(AppInfo.ML_TRANSACTION_MODES.DELEGATION)
      setWalletType({ name: 'Mintlayer' })
      setPreEnterAddress(state.pool_id)
    } else {
      setPreEnterAddress('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    const amountToSend = MLHelpers.getAmountInAtoms(transactionInfo.amount)
    const unusedChangeAddress = await ML.getUnusedAddress(changeAddresses)
    const unusedReceivingAddress = await ML.getUnusedAddress(receivingAddresses)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)
    const fee =
      transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
        ? await MLTransaction.calculateFee({
          utxosTotal: parsedUtxos,
          changeAddress: unusedChangeAddress,
          amountToUse: amountToSend,
          network: networkType,
          delegationId: address,
        })
        : transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
          ? await MLTransaction.calculateSpenDelegFee(
            address,
            amountToSend,
            networkType,
            currentDelegationInfo,
          )
          : await MLTransaction.calculateFee({
            utxosTotal: parsedUtxos,
            address: unusedReceivingAddress,
            changeAddress: unusedChangeAddress,
            amountToUse: BigInt(0),
            network: networkType,
            poolId: address,
          })
    const feeInCoins = MLHelpers.getAmountInCoins(Number(fee))
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

    const unusedChageAddress = await ML.getUnusedAddress(changeAddresses)
    const unusedReceivingAddress = await ML.getUnusedAddress(receivingAddresses)
    const utxos = await Mintlayer.getWalletUtxos(mlAddressList)
    const parsedUtxos = utxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)

    const result =
      transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
        ? await MLTransaction.sendTransaction({
          utxosTotal: parsedUtxos,
          keysList: keysList,
          changeAddress: unusedChageAddress,
          amountToUse: amountToSend,
          network: networkType,
          delegationId: transactionInformation.to,
        })
        : transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
          ? await MLTransaction.spendFromDelegation(
            keysList,
            transactionInformation.to,
            amountToSend,
            networkType,
            currentDelegationInfo,
          )
          : await MLTransaction.sendTransaction({
            utxosTotal: parsedUtxos,
            keysList: keysList,
            address: unusedReceivingAddress,
            changeAddress: unusedChageAddress,
            amountToUse: BigInt('0'),
            network: networkType,
            poolId: transactionInformation.to,
            transactionMode: transactionMode,
          })

    return result
  }

  return (
    <>
      <Header />
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
            preEnterAddress={preEnterAddress}
            transactionMode={AppInfo.ML_TRANSACTION_MODES.STAKING}
            currentDelegationInfo={currentDelegationInfo}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default DelegationStakePage
