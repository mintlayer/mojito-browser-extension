import { useCallback, useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SendMlTransaction } from '@ContainerComponents'
import { SendPageHeader } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import { PageWrapper } from '@BasicComponents'
import styles from './SendMlTransaction.module.css'

const SendMlTransactionPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const { coinType } = useParams()
  const walletType = useMemo(
    () => ({
      name: coinType,
      ticker: 'ML',
      chain: 'mintlayer',
      tokenId: ['Mintlayer', 'Bitcoin'].includes(coinType) ? null : coinType,
    }),
    [coinType],
  )

  const datahook = useMlWalletInfo
  const { client, utxos } = useContext(MintlayerContext)
  const currentMlAddresses = addresses.mlAddresses
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [feeLoading, setFeeLoading] = useState(false)
  const [feeError, setFeeError] = useState('')
  const navigate = useNavigate()

  const { balance, tokenBalances } = datahook(currentMlAddresses, coinType)

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
  })
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)
  const { exchangeRate } = useExchangeRates(tokenName, fiatName)

  const buildMlTransaction = useCallback(
    ({ to, amount }) => {
      if (walletType?.tokenId) {
        return client.buildTransfer({
          to,
          amount,
          token_id: walletType.tokenId,
        })
      }

      return client.buildTransaction({
        type: 'Transfer',
        params: { to, amount },
        ...(utxos?.length ? { opts: { withUTXO: utxos } } : {}),
      })
    },
    [client, walletType, utxos],
  )

  useEffect(() => {
    if (
      !isFormValid ||
      !(transactionInformation?.to.length > 0) ||
      !(transactionInformation?.amount > 0)
    ) {
      setFeeLoading(false)
      return
    }

    let cancelled = false
    setFeeLoading(true)
    setFeeError('')

    const timer = setTimeout(async () => {
      try {
        const transaction = await buildMlTransaction(transactionInformation)
        if (cancelled) return
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
      } catch (error) {
        if (cancelled) return
        console.error('Fee calculation failed:', error)
        setTotalFeeCrypto(0)
        const message = error.message?.includes('Not enough coin UTXOs')
          ? 'Insufficient balance'
          : error.message || 'Fee calculation failed'
        setFeeError(message)
      } finally {
        if (!cancelled) setFeeLoading(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [transactionInformation, buildMlTransaction, isFormValid])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const transaction = await buildMlTransaction(transactionInformation)
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
        <SendPageHeader
          ticker={tokenName}
          networkName="Mintlayer"
          isTestnet={isTestnet}
        />
        <VerticalGroup smallGap>
          <SendMlTransaction
            totalFeeCrypto={totalFeeCrypto}
            feeLoading={feeLoading}
            feeError={feeError}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={balance}
            setFormValidity={setFormValid}
            onSendTransaction={createTransaction}
            confirmTransaction={confirmMlTransaction}
            isFormValid={isFormValid}
            goBackToWallet={goBackToWallet}
            walletType={walletType}
          />
        </VerticalGroup>
      </div>
    </PageWrapper>
  )
}

export default SendMlTransactionPage
