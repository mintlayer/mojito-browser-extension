import { useEffect, useContext, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext, TransactionContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './DelegationStake.css'
import { Error } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

const DelegationStakePage = () => {
  const { delegationId } = useParams()
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }
  const transactionMode = AppInfo.ML_TRANSACTION_MODES.STAKING
  const { addresses, accountID } = useContext(AccountContext)
  const { client } = useContext(MintlayerContext)
  const currentMlAddresses = addresses.mlAddresses
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
    navigate('/wallet/' + walletType.name + '/staking')
  }
  const { setDelegationStep } = useContext(TransactionContext)
  const [isFormValid, setFormValid] = useState(false)
  const [transactionInformation, setTransactionInformation] = useState(null)
  const [feeLoading, setFeeLoading] = useState(false)

  const { exchangeRate } = useExchangeRates(tokenName, fiatName)
  const {
    balance: mlBalance,
    utxos,
    unusedAddresses,
    fetchingBalances,
    fetchingUtxos,
  } = useMlWalletInfo(currentMlAddresses)
  const maxValueToken = mlBalance

  const transaction_conditions =
    utxos.length > 0 &&
    mlBalance > 0 &&
    unusedAddresses.change &&
    unusedAddresses.receive

  const loading = fetchingBalances || fetchingUtxos

  useEffect(() => {
    const buildTransaction = async () => {
      if (
        transaction_conditions &&
        delegationId &&
        transactionInformation?.amount > 0
      ) {
        setFeeLoading(true)
        const transaction = await client.buildDelegationStake({
          amount: transactionInformation.amount,
          delegation_id: transactionInformation.to,
        })
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        setFeeLoading(false)
      }
    }
    buildTransaction()
  }, [
    transaction_conditions,
    transactionInformation,
    client,
    unusedAddresses,
    delegationId,
  ])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const result = await client.delegationStake({
      amount: transactionInformation.amount,
      delegation_id: transactionInformation.to,
    })
    return result
  }

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
          <SendMlTransaction
            totalFeeCrypto={totalFeeCrypto}
            feeLoading={feeLoading}
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
    </>
  )
}

export default DelegationStakePage
