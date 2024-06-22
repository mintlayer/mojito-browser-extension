import { useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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
import { Error } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

const CreateDelegationPage = () => {
  const { state } = useLocation()

  // staking only for Mintlayer
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }

  const transactionMode = AppInfo.ML_TRANSACTION_MODES.DELEGATION

  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading } = useContext(TransactionContext)
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
    navigate('/wallet/' + walletType.name + '/staking')
  }
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const {
    balance: mlBalance,
    utxos,
    fetchDelegations,
    unusedAddresses,
    feerate,
    fetchingBalances,
    fetchingUtxos,
  } = useMlWalletInfo(currentMlAddresses)
  const maxValueToken = mlBalance

  const preEnterAddress = state?.pool_id || ''

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
    }
    const transactionSize = await MLTransaction.calculateTransactionSizeInBytes(
      {
        utxos: utxos,
        address: unusedReceivingAddress,
        changeAddress: unusedChangeAddress,
        amountToUse: BigInt(0),
        network: networkType,
        poolId: address,
        approximateFee: 0,
      },
    )
    const fee = Math.ceil(feerate * (transactionSize / 1000))
    const newTransactionSize =
      await MLTransaction.calculateTransactionSizeInBytes({
        utxos: utxos,
        address: unusedReceivingAddress,
        changeAddress: unusedChangeAddress,
        amountToUse: BigInt(0),
        network: networkType,
        poolId: address,
        approximateFee: fee,
      })
    const newFee = Math.ceil(feerate * (newTransactionSize / 1000))
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
      utxos: utxos,
      keysList: keysList,
      address: unusedReceivingAddress,
      changeAddress: unusedChageAddress,
      amountToUse: BigInt('0'),
      network: networkType,
      poolId: transactionInformation.to,
      transactionMode: transactionMode,
      adjustedFee: totalFee,
    })

    if (result) {
      // map txid to referral code
      try {
        console.log('state?.referral_code', state?.referral_code)
        const REFERRAL_TRACK_ENDPOINT = {
          mainnet: 'https://api-server.mintlayer.org/track',
          testnet: 'https://api-server-lovelace.mintlayer.org/track',
        }
        const referralCode = state?.referral_code || ''
        if (referralCode) {
          const txid = result
          console.log('txid', txid)
          // send request to api server to track txid and referral_code
          await fetch(REFERRAL_TRACK_ENDPOINT[networkType], {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              txid,
              referral_code: referralCode,
            }),
          })
        }
      } catch (error) {
        console.error('Error:', error)
      }

      await fetchDelegations()
    }

    return result
  }

  const transaction_conditions =
    utxos.length > 0 &&
    mlBalance > 0 &&
    unusedAddresses.change &&
    unusedAddresses.receive

  const loading = preEnterAddress && (fetchingBalances || fetchingUtxos)

  return (
    <>
      <div className="page">
        <VerticalGroup>
          {loading ? (
            <div className="page-loading">
              <Loading />
            </div>
          ) : (
            <></>
          )}
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
            isFormValid={transaction_conditions && isFormValid}
            confirmTransaction={confirmMlTransaction}
            goBackToWallet={goBackToWallet}
            preEnterAddress={preEnterAddress}
            transactionMode={transactionMode}
            walletType={walletType}
          />
          {!transaction_conditions && (
            <Error error="Insufficient funds for the fee. Please wait for the wallet to sync or add coins to the wallet." />
          )}
        </VerticalGroup>
      </div>
    </>
  )
}

export default CreateDelegationPage
