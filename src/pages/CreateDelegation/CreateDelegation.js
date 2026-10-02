import { useCallback, useEffect, useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './CreateDelegation.css'
import { Error, PageWrapper } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

const CreateDelegationPage = () => {
  const { state } = useLocation()
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }
  const transactionMode = AppInfo.ML_TRANSACTION_MODES.DELEGATION
  const { accountID } = useContext(AccountContext)
  const { client, fetchDelegations } = useContext(MintlayerContext)
  const [totalFeeCrypto, setTotalFeeCrypto] = useState(0)
  const navigate = useNavigate()
  const tokenName = 'ML'
  const fiatName = 'USD'
  const [transactionData] = useState({
    fiatName,
    tokenName,
  })
  const goBackToWallet = () => {
    navigate('/staking')
  }
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)
  const [feeLoading, setFeeLoading] = useState(false)
  const [feeError, setFeeError] = useState('')

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const {
    balance: mlBalance,
    utxos,
    unusedAddresses,
    fetchingBalances,
    fetchingUtxos,
  } = useMlWalletInfo()

  const preEnterAddress = state?.pool_id || ''
  const transaction_conditions =
    utxos.length > 0 &&
    mlBalance > 0 &&
    unusedAddresses.change &&
    unusedAddresses.receive

  const loading = preEnterAddress && (fetchingBalances || fetchingUtxos)

  const buildDelegationTransaction = useCallback(
    ({ pool_id, destination }) =>
      client.buildTransaction({
        type: 'CreateDelegationId',
        params: { pool_id, destination },
        ...(utxos.length ? { opts: { withUTXO: utxos } } : {}),
      }),
    [client, utxos],
  )

  useEffect(() => {
    const buildTransaction = async () => {
      if (transaction_conditions && transactionInformation?.to.length > 0) {
        setFeeLoading(true)
        setFeeError('')
        try {
          const unusedReceivingAddress = unusedAddresses.receive
          const transaction = await buildDelegationTransaction({
            pool_id: transactionInformation.to,
            destination: unusedReceivingAddress,
          })
          setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        } catch (e) {
          console.error('Failed to calculate delegation fee:', e)
          setTotalFeeCrypto(0)
          setFeeError(e.message || 'Fee calculation failed')
        } finally {
          setFeeLoading(false)
        }
      }
    }
    buildTransaction()
  }, [
    transaction_conditions,
    transactionInformation,
    buildDelegationTransaction,
    unusedAddresses,
  ])

  useEffect(() => {
    if (!accountID) {
      navigate('/dashboard')
    }
  }, [accountID, navigate])

  if (!accountID) {
    return null
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const unusedReceivingAddress = unusedAddresses.receive

    const transaction = await buildDelegationTransaction({
      pool_id: transactionInformation.to,
      destination: unusedReceivingAddress,
    })
    const result = await client.signTransaction(transaction)

    if (result) {
      await fetchDelegations()
    }

    return result
  }

  return (
    <PageWrapper>
      <div className="page">
        <VerticalGroup>
          {loading ? (
            <div className="page-loading">
              <Loading />
            </div>
          ) : (
            <></>
          )}
          <SendMlTransaction
            totalFeeCrypto={totalFeeCrypto}
            feeLoading={feeLoading}
            feeError={feeError}
            transactionData={transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={mlBalance}
            onSendTransaction={createTransaction}
            setFormValidity={setFormValid}
            isFormValid={transaction_conditions && isFormValid}
            confirmTransaction={confirmMlTransaction}
            goBackToWallet={goBackToWallet}
            preEnterAddress={preEnterAddress}
            transactionMode={transactionMode}
            walletType={walletType}
          />
          {feeError && <Error error={feeError} />}
          {!transaction_conditions && (
            <Error error="Insufficient funds for the fee. Please wait for the wallet to sync or add coins to the wallet." />
          )}
        </VerticalGroup>
      </div>
    </PageWrapper>
  )
}

export default CreateDelegationPage
