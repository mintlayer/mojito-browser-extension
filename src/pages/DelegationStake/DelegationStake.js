import { useCallback, useEffect, useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext, TransactionContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './DelegationStake.css'
import { Error, PageWrapper } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

const DelegationStakePage = () => {
  const { delegationId } = useParams()
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }
  const transactionMode = AppInfo.ML_TRANSACTION_MODES.STAKING
  const { accountID } = useContext(AccountContext)
  const { client } = useContext(MintlayerContext)
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
    navigate('/staking')
  }
  const { setDelegationStep } = useContext(TransactionContext)
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
  const maxValueToken = mlBalance

  const transaction_conditions =
    utxos.length > 0 &&
    mlBalance > 0 &&
    unusedAddresses.change &&
    unusedAddresses.receive

  const loading = fetchingBalances || fetchingUtxos

  const buildStakeTransaction = useCallback(
    ({ amount, delegation_id }) =>
      client.buildTransaction({
        type: 'DelegateStaking',
        params: { delegation_id, amount },
        ...(utxos.length ? { opts: { withUTXO: utxos } } : {}),
      }),
    [client, utxos],
  )

  useEffect(() => {
    const buildTransaction = async () => {
      if (
        transaction_conditions &&
        delegationId &&
        transactionInformation?.amount > 0
      ) {
        setFeeLoading(true)
        setFeeError('')
        try {
          const transaction = await buildStakeTransaction({
            amount: transactionInformation.amount,
            delegation_id: transactionInformation.to,
          })
          setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        } catch (e) {
          console.error('Failed to calculate staking fee:', e)
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
    buildStakeTransaction,
    unusedAddresses,
    delegationId,
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
    const transaction = await buildStakeTransaction({
      amount: transactionInformation.amount,
      delegation_id: transactionInformation.to,
    })
    const result = await client.signTransaction(transaction)
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
            maxValueInToken={maxValueToken}
            onSendTransaction={createTransaction}
            setFormValidity={setFormValid}
            isFormValid={transaction_conditions && isFormValid}
            confirmTransaction={confirmMlTransaction}
            goBackToWallet={goBackToWallet}
            preEnterAddress={delegationId}
            transactionMode={transactionMode}
            walletType={walletType}
          />
          {!transaction_conditions && (
            <Error error="Insufficient funds for the fee. Please wait for the wallet to sync or add coins to the wallet." />
          )}
        </VerticalGroup>
      </div>
    </PageWrapper>
  )
}

export default DelegationStakePage
