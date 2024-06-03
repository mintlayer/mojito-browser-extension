import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'
import { Account } from '@Entities'
import { Format } from '@Helpers'
import { AppInfo } from '@Constants'
import { MLTransaction, ML as MLHelpers } from '@Helpers'
import { ML } from '@Cryptos'

import './DelegationStake.css'

const DelegationStakePage = () => {
  const { delegationId } = useParams()

  // staking only for Mintlayer
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }

  const currentDelegationInfo = {
    delegation_id: delegationId,
    balance: 0,
  }

  const transactionMode = AppInfo.ML_TRANSACTION_MODES.STAKING

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading, setDelegationStep } = useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [totalFee, setTotalFee] = useState(0)
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
  const {
    balance: mlBalance,
    utxos,
    unusedAddresses,
    feerate,
  } = useMlWalletInfo(currentMlAddresses)

  console.log('mlBalance', mlBalance)
  const maxValueToken = mlBalance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const changeAddressesLength = currentMlAddresses.mlChangeAddresses.length

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const amountToSend = MLHelpers.getAmountInAtoms(transactionInfo.amount)
    const unusedChangeAddress = unusedAddresses.change
    const transactionSize = await MLTransaction.calculateTransactionSizeInBytes(
      {
        utxos: utxos,
        changeAddress: unusedChangeAddress,
        amountToUse: amountToSend,
        network: networkType,
        delegationId: address,
        approximateFee: 0,
      },
    )
    console.log('transactionSize', transactionSize)
    const fee = Math.ceil(feerate * (transactionSize / 1000))

    console.log('fee - 1', fee)

    const newTransactionSize =
      await MLTransaction.calculateTransactionSizeInBytes({
        utxos: utxos,
        changeAddress: unusedChangeAddress,
        amountToUse: amountToSend - BigInt(fee),
        network: networkType,
        delegationId: address,
        approximateFee: fee,
      })
    const newFee = Math.ceil(feerate * (newTransactionSize / 1000))
    console.log('fee - 2', newFee)
    const newFeeInCoins = MLHelpers.getAmountInCoins(Number(newFee))
    setTotalFeeFiat(Format.fiatValue(newFeeInCoins * exchangeRate))
    setTotalFeeCrypto(newFeeInCoins)
    setTotalFee(newFee)
    setFeeLoading(false)
    return newFeeInCoins
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

    const unusedChangeAddress = unusedAddresses.change

    const result = await MLTransaction.sendTransaction({
      utxos: utxos,
      keysList: keysList,
      changeAddress: unusedChangeAddress,
      amountToUse: amountToSend,
      network: networkType,
      delegationId: transactionInformation.to,
      adjustedFee: totalFee,
    })

    return result
  }

  return (
    <>
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
            transactionMode={transactionMode}
            currentDelegationInfo={currentDelegationInfo}
            walletType={walletType}
            preEnterAddress={delegationId}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default DelegationStakePage
