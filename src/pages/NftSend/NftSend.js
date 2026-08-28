import { useCallback, useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import { PageWrapper } from '@BasicComponents'
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

  const { client, utxos, nftInitialUtxos, nftData } =
    useContext(MintlayerContext)
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

  const nftUtxos = useMemo(() => {
    const outpointKey = ({ outpoint }) =>
      `${outpoint.source_id}:${outpoint.index}`
    const selectedKeys = new Set(utxos.map(outpointKey))
    return [
      ...utxos,
      ...nftInitialUtxos.filter((utxo) => !selectedKeys.has(outpointKey(utxo))),
    ]
  }, [utxos, nftInitialUtxos])

  const nftDetails = useMemo(() => {
    const nft = nftData.find((item) => item.token_id === tokenId)
    return nft ? { ...nft.data, number_of_decimals: 0 } : null
  }, [nftData, tokenId])

  const buildNftTransaction = useCallback(
    ({ to }) => {
      if (!nftDetails || !nftUtxos.length) {
        return client.buildTransferNft({ to, token_id: tokenId })
      }

      return client.buildTransaction({
        type: 'Transfer',
        params: {
          to,
          amount: 1,
          token_id: tokenId,
          token_details: nftDetails,
        },
        opts: { withUTXO: nftUtxos },
      })
    },
    [client, tokenId, nftDetails, nftUtxos],
  )

  useEffect(() => {
    const buildTransaction = async () => {
      if (transactionInformation?.to.length > 0) {
        setFeeLoading(true)
        const transaction = await buildNftTransaction(transactionInformation)
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        setFeeLoading(false)
      }
    }
    buildTransaction()
  }, [transactionInformation, buildNftTransaction])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const transaction = await buildNftTransaction(transactionInformation)
    const result = await client.signTransaction(transaction)
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
    <PageWrapper>
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
    </PageWrapper>
  )
}

export default NftSendPage
