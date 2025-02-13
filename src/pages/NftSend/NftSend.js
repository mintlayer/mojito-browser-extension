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
import { Mintlayer } from '@APIs'

import styles from './NftSend.module.css'

const getNftUtxo = (utxos, nftInitialUtxos, tokenId) => {
  const mergedUtxos = [...utxos, ...nftInitialUtxos]
  return mergedUtxos.filter((utxo) => {
    return (
      utxo.utxo?.value?.token_id === tokenId || utxo?.utxo?.token_id === tokenId
    )
  })
}

const getNftCreationBlockHeight = async (nftUtxos) => {
  try {
    const nftUtxo = nftUtxos[0]
    const txid = nftUtxo.outpoint.source_id
    const transactionData = await Mintlayer.getTransactionData(txid)
    const blockData = await Mintlayer.getBlockDataByHash(
      transactionData.block_id,
    )
    return JSON.parse(blockData).height
  } catch (e) {
    console.error('Error getting block height sinding NFT:', e)
  }
}

const NftSendPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { tokenId } = useParams()

  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
    tokenId: tokenId,
  }

  const { networkType } = useContext(SettingsContext)
  const { setFeeLoading } = useContext(TransactionContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [totalFee, setTotalFee] = useState(BigInt(0))
  const [totalFeeFiat, setTotalFeeFiat] = useState(0)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [adjustedFee, setAdjustedFee] = useState(0)
  const navigate = useNavigate()

  const { balance, utxos, unusedAddresses, feerate, nftInitialUtxos } =
    useMlWalletInfo(currentMlAddresses)

  const nftUtxos = getNftUtxo(utxos, nftInitialUtxos, tokenId)

  const tokenName = 'ML'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
    tokenId,
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

  const calculateMlTotalFee = async (transactionInfo) => {
    setFeeLoading(true)
    const address = transactionInfo.to
    const amountToSend = 1
    const unusedChangeAddress = unusedAddresses.change
    try {
      const transactionSize =
        nftUtxos[0].utxo.type === 'IssueNft'
          ? await MLTransaction.calculateIssueNftTxSizeInBytes({
              utxos: utxos,
              address: address,
              changeAddress: unusedChangeAddress,
              amountToUse: amountToSend,
              network: networkType,
              nftUtxo: nftUtxos,
              tokenId: walletType.tokenId,
              approximateFee: 0,
            })
          : await MLTransaction.calculateTransactionSizeInBytes({
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
        nftUtxos[0].utxo.type === 'IssueNft'
          ? await MLTransaction.calculateIssueNftTxSizeInBytes({
              utxos: utxos,
              address: address,
              changeAddress: unusedChangeAddress,
              amountToUse: '1',
              network: networkType,
              nftUtxo: nftUtxos,
              tokenId: walletType.tokenId,
              approximateFee: fee,
            })
          : await MLTransaction.calculateTransactionSizeInBytes({
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
    calculateMlTotalFee(transactionInfo)
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async (password) => {
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

    const nftHeight = await getNftCreationBlockHeight(nftUtxos)

    const result =
      nftUtxos[0].utxo.type === 'IssueNft'
        ? await MLTransaction.sendIssueNft({
            utxos: utxos,
            nftUtxo: nftUtxos,
            keysList: keysList,
            address: transactionInformation.to,
            changeAddress: unusedChangeAddress,
            amountToUse: 1,
            network: networkType,
            transactionMode: AppInfo.ML_TRANSACTION_MODES.NFT,
            tokenId,
            chainTip: nftHeight,
            ...(adjustedFee
              ? {
                  adjustedFee: MLHelpers.getAmountInAtoms(adjustedFee),
                }
              : {
                  adjustedFee: totalFee,
                }),
          })
        : await MLTransaction.sendTransaction({
            utxos: utxos,
            keysList: keysList,
            address: transactionInformation.to,
            changeAddress: unusedChangeAddress,
            amountToUse: 1,
            network: networkType,
            tokenId: tokenId,
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

  const goBackToWallet = () => navigate('/wallet/' + walletType.name)

  return (
    <>
      <div className={styles.page}>
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
            confirmTransaction={confirmMlTransaction}
            goBackToWallet={goBackToWallet}
            walletType={walletType}
            transactionMode={AppInfo.ML_TRANSACTION_MODES.NFT}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default NftSendPage
