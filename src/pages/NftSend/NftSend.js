import { useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import styles from './NftSend.module.css'

const NftSendPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const transactionMode = AppInfo.ML_TRANSACTION_MODES.NFT_SEND
  const { coinType, tokenId } = useParams()
  const walletType = useMemo(
    () => ({
      name: coinType,
      ticker: 'ML',
      chain: 'mintlayer',
      tokenId: tokenId,
    }),
    [coinType, tokenId],
  )

  const { client } = useContext(MintlayerContext)
  const currentMlAddresses = addresses.mlAddresses
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [feeLoading, setFeeLoading] = useState(false)
  const navigate = useNavigate()

  const { balance, tokenBalances } = useMlWalletInfo(
    currentMlAddresses,
    coinType,
  )

  const symbol = () => {
    if (walletType.name === 'Mintlayer') {
      return 'ML'
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
    tokenId,
  })
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)
  const { exchangeRate } = useExchangeRates(tokenName, fiatName)

  useEffect(() => {
    const buildTransaction = async () => {
      if (transactionInformation?.to.length > 0) {
        setFeeLoading(true)
        const transaction = await client.buildTransferNft({
          to: transactionInformation.to,
          token_id: tokenId,
        })
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        setFeeLoading(false)
      }
    }
    buildTransaction()
  }, [transactionInformation, client, walletType, tokenId])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const result = await client.transferNft({
      to: transactionInformation.to,
      token_id: tokenId,
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
      <div className={styles.page}>
        <VerticalGroup smallGap>
          <SendMlTransaction
            totalFeeCrypto={totalFeeCrypto}
            feeLoading={feeLoading}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={balance}
            setFormValidity={setFormValid}
            onSendTransaction={createTransaction}
            confirmTransaction={confirmMlTransaction}
            isFormValid={isFormValid}
            goBackToWallet={goBackToWallet}
            walletType={walletType}
            transactionMode={transactionMode}
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default NftSendPage
