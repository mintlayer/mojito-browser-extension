import { useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, SettingsContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './SendMlTransaction.css'

const SendMlTransactionPage = () => {
  const { addresses, accountID } = useContext(AccountContext)

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

  const { networkType } = useContext(SettingsContext)
  const { client } = useContext(MintlayerContext)
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const [feeLoading, setFeeLoading] = useState(false)
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

  useEffect(() => {
    const buildTransaction = async () => {
      if (
        isFormValid &&
        transactionInformation?.to.length > 0 &&
        transactionInformation?.amount > 0
      ) {
        setFeeLoading(true)
        const transaction = await client.buildTransfer({
          to: transactionInformation.to,
          amount: transactionInformation.amount,
          token_id: walletType?.tokenId,
        })
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        setFeeLoading(false)
      }
    }
    buildTransaction()
  }, [transactionInformation, client, walletType, isFormValid])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const result = await client.transfer({
      to: transactionInformation.to,
      amount: transactionInformation.amount,
      token_id: walletType?.tokenId,
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
          />
        </VerticalGroup>
      </div>
    </>
  )
}

export default SendMlTransactionPage
