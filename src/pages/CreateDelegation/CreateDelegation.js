import { useContext, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'
import { Account } from '@Entities'
import { Format } from '@Helpers'
import { AppInfo } from '@Constants'
import { MLTransaction, ML as MLHelpers } from '@Helpers'
import { ML } from '@Cryptos'

import './CreateDelegation.css'

const CreateDelegationPage = () => {
  const { state } = useLocation()
  const { coinType } = useParams()

  const walletType = {
    name: coinType,
  }

  const transactionMode = AppInfo.ML_TRANSACTION_MODES.DELEGATION

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading, setDelegationStep, setTransactionMode } =
    useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
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
  const { mlBalance, utxos, fetchDelegations, unusedAddresses, feerate } =
    useMlWalletInfo(currentMlAddresses)
  const maxValueToken = mlBalance
  // const customBackAction = () => {
  //   setDelegationStep(1)
  //   navigate('/wallet')
  // }

  useEffect(() => {
    if (state && state.action === 'createDelegate') {
      setDelegationStep(2)
      setTransactionMode(AppInfo.ML_TRANSACTION_MODES.DELEGATION)
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

  const changeAddressesLength = currentMlAddresses.mlChangeAddresses.length

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const unusedChangeAddress = unusedAddresses.change
    const unusedReceivingAddress = unusedAddresses.receive
    if (utxos.length === 0) {
      setFeeLoading(false)
      throw new Error('No UTXOs available')
      return false
    }
    const transactionSize = await MLTransaction.calculateTransactionSizeInBytes(
      {
        utxosTotal: utxos,
        address: unusedReceivingAddress,
        changeAddress: unusedChangeAddress,
        amountToUse: BigInt(0),
        network: networkType,
        poolId: address,
      },
    )
    const fee = feerate * (transactionSize / 1000)
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

    const unusedChageAddress = unusedAddresses.change
    const unusedReceivingAddress = unusedAddresses.receive

    const result = await MLTransaction.sendTransaction({
      utxosTotal: utxos,
      keysList: keysList,
      address: unusedReceivingAddress,
      changeAddress: unusedChageAddress,
      amountToUse: BigInt('0'),
      network: networkType,
      poolId: transactionInformation.to,
      transactionMode: transactionMode,
    })

    if (result) {
      await fetchDelegations()
    }

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
            preEnterAddress={preEnterAddress}
            transactionMode={transactionMode}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default CreateDelegationPage
