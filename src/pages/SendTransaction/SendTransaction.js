import { useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SendTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import {
  AccountContext,
  SettingsContext,
  TransactionContext,
  BitcoinContext,
} from '@Contexts'
import { BTCTransaction } from '@Cryptos'
import { Account } from '@Entities'
import { BTC as BTCHelper, Format } from '@Helpers'
import { Electrum } from '@APIs'
import { AppInfo } from '@Constants'
import { MLTransaction, ML as MLHelpers } from '@Helpers'
import { ML, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import './SendTransaction.css'

const SendTransactionPage = () => {
  const { addresses, accountID } = useContext(AccountContext)

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: coinType === 'Bitcoin' ? 'BTC' : 'ML',
    chain: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
    tokenId: ['Mintlayer', 'Bitcoin'].includes(coinType) ? null : coinType,
  }

  const datahook =
    walletType.chain === 'bitcoin' ? useBtcWalletInfo : useMlWalletInfo

  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading } = useContext(TransactionContext)
  const { unusedAddresses: unusedBtcAddresses, btcUtxos } =
    useContext(BitcoinContext)

  const currentBtcAddress = addresses.btcAddresses.btcReceivingAddresses[0]
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [totalFee, setTotalFee] = useState(BigInt(0))
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [adjustedFee, setAdjustedFee] = useState(0)
  const navigate = useNavigate()

  const checkAddresses =
    walletType.chain === 'bitcoin' ? currentBtcAddress : currentMlAddresses

  const { balance, utxos, unusedAddresses, feerate, tokenBalances } = datahook(
    checkAddresses,
    coinType,
  )

  const symbol = () => {
    if (walletType.name === 'Mintlayer') {
      return 'ML'
    }
    if (walletType.name === 'Bitcoin') {
      return 'BTC'
    }
    if (
      !tokenBalances ||
      !tokenBalances[walletType.name] ||
      !tokenBalances[walletType.name].token_info
    ) {
      return 'TKN'
    }
    return tokenBalances[walletType.name].token_info.token_ticker.string
  }

  const tokenName = symbol()
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)

  const maxValueToken = balance

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const changeAddressesLength =
    currentMlAddresses && currentMlAddresses.mlChangeAddresses.length

  const calculateBtcTotalFee = async (transactionInfo) => {
    const currentAccount = await Account.getAccount(accountID)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

    const totalFee = await BTCTransaction.calculateBtcTransactionFee({
      to: transactionInfo.to,
      amount: BTCHelper.convertBtcToSatoshi(transactionInfo.amount),
      utxos: btcUtxos || [],
      feeRate: transactionInfo.fee,
      walletType: btcWalletType,
    })

    const formatedFee = Format.BTCValue(BTCHelper.convertSatoshiToBtc(totalFee))

    setTotalFeeFiat(Format.fiatValue(formatedFee * exchangeRate))
    setTotalFeeCrypto(formatedFee)
  }

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const atoms = walletType.tokenId
      ? tokenBalances[walletType.tokenId].token_info.number_of_decimals
      : 11
    const amountToSend = MLHelpers.getAmountInAtoms(
      transactionInfo.amount,
      Math.pow(10, atoms),
    )
    const unusedChangeAddress =
      unusedAddresses.change || unusedAddresses.changeAddress.address
    try {
      const transactionSize =
        await MLTransaction.calculateTransactionSizeInBytes({
          utxos: utxos,
          address: address,
          changeAddress: unusedChangeAddress,
          amountToUse: amountToSend,
          tokenId: walletType.tokenId,
          network: networkType,
          approximateFee: 0,
        })
      const fee = Math.ceil(feerate * (transactionSize / 1000))

      // recalculating transaction size with feeInCoins
      const newTransactionSize =
        await MLTransaction.calculateTransactionSizeInBytes({
          utxos: utxos,
          address: address,
          changeAddress: unusedChangeAddress,
          amountToUse: amountToSend,
          tokenId: walletType.tokenId,
          network: networkType,
          approximateFee: fee,
        })
      const newFee = Math.ceil(feerate * (newTransactionSize / 1000))
      const newFeeInCoins = MLHelpers.getAmountInCoins(Number(newFee))

      setTotalFeeFiat(Format.fiatValue(newFeeInCoins * exchangeRate))
      setTotalFeeCrypto(newFeeInCoins)
      setTotalFee(newFee)
      setFeeLoading(false)
      return newFeeInCoins
    } catch (e) {
      console.error('Error calculating fee:', e)
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
    const { btcPrivateKeys } = await Account.unlockAccount(accountID, password)
    const transactionAmountInSatoshi = BTCHelper.convertBtcToSatoshi(
      transactionInformation.amount,
    )

    const currentAccount = await Account.getAccount(accountID)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

    // eslint-disable-next-line no-unused-vars
    const [__, transactionHex] = await BTCTransaction.buildTransaction({
      to: transactionInformation.to,
      amount: transactionAmountInSatoshi,
      utxos: btcUtxos || [],
      feeRate: transactionInformation.fee,
      walletType: btcWalletType,
      changeAddress:
        unusedBtcAddresses.changeAddress.address ||
        addresses.btcAddresses.btcChangeAddresses[0],
      root: btcPrivateKeys,
    })

    console.log('Built transaction hex:', transactionHex)

    const result = await Electrum.broadcastTransaction(transactionHex)
    return result
  }

  const confirmMlTransaction = async (password) => {
    const atoms = walletType.tokenId
      ? tokenBalances[walletType.tokenId].token_info.number_of_decimals
      : 11
    const amountToSend = MLHelpers.getAmountInAtoms(
      transactionInformation.amount,
      Math.pow(10, atoms),
    )
    const { mlPrivKeys } = await Account.unlockAccount(accountID, password)
    const privKey =
      networkType === 'mainnet'
        ? mlPrivKeys.mlMainnetPrivateKey
        : mlPrivKeys.mlTestnetPrivateKey

    const walletPrivKeys = ML.getWalletPrivKeysList(
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
      address: transactionInformation.to,
      changeAddress: unusedChangeAddress,
      amountToUse: amountToSend,
      network: networkType,
      tokenId: walletType.tokenId,
      ...(adjustedFee
        ? {
            adjustedFee: MLHelpers.getAmountInAtoms(adjustedFee),
          }
        : {
            adjustedFee: totalFee,
          }),
    })
    return result
  }

  const goBackToWallet = () => {
    if (walletType.tokenId) {
      navigate('/')
    } else {
      navigate('/wallet/' + walletType.name)
    }
  }

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
            calculateTotalFee={calculateMlTotalFee}
            setFormValidity={setFormValid}
            isFormValid={isFormValid}
            confirmTransaction={
              walletType.name === 'Bitcoin'
                ? confirmBtcTransaction
                : confirmMlTransaction
            }
            goBackToWallet={goBackToWallet}
            walletType={walletType}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendTransactionPage
