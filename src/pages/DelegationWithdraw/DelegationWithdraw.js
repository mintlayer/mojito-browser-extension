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

import './DelegationWithdraw.css'

const DelegationWithdrawPage = () => {
  const { delegationId } = useParams()

  // staking only for Mintlayer
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }

  const transactionMode = AppInfo.ML_TRANSACTION_MODES.WITHDRAW

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading, setDelegationStep } = useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
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
    navigate('/wallet/' + walletType.name + '/staking')
  }
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const { mlDelegationList, currentHeight } = useMlWalletInfo(currentMlAddresses)

  const currentDelegationInfo = mlDelegationList.find(
    (delegation) => delegation.delegation_id === delegationId,
  )

  const delegationBalance = Format.BTCValue(
    MLHelpers.getAmountInCoins(currentDelegationInfo.balance),
  )

  const maxValueToken = delegationBalance

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
    const fee = await MLTransaction.calculateSpenDelegFee(
      address,
      amountToSend,
      networkType,
      currentDelegationInfo,
      currentHeight,
    )
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

    const result = await MLTransaction.spendFromDelegation(
      keysList,
      transactionInformation.to,
      amountToSend,
      networkType,
      currentDelegationInfo,
      currentHeight,
    )

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
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default DelegationWithdrawPage
