import { useEffect, useContext, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { SendMlTransaction } from '@ContainerComponents'
import { VerticalGroup } from '@LayoutComponents'
import { useExchangeRates, useMlWalletInfo } from '@Hooks'
import { AccountContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './CreateDelegation.css'
import { Error } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

const CreateDelegationPage = () => {
  const { state } = useLocation()
  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }
  const transactionMode = AppInfo.ML_TRANSACTION_MODES.DELEGATION
  const { addresses, accountID } = useContext(AccountContext)
  const { client, fetchDelegations } = useContext(MintlayerContext)
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
    navigate('/wallet/' + walletType.name + '/staking')
  }
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

  const preEnterAddress = state?.pool_id || ''
  const transaction_conditions =
    utxos.length > 0 &&
    mlBalance > 0 &&
    unusedAddresses.change &&
    unusedAddresses.receive

  const loading = preEnterAddress && (fetchingBalances || fetchingUtxos)

  useEffect(() => {
    const buildTransaction = async () => {
      if (transaction_conditions && transactionInformation?.to.length > 0) {
        setFeeLoading(true)
        const unusedReceivingAddress = unusedAddresses.receive
        const transaction = await client.buildDelegationCreate({
          pool_id: transactionInformation.to,
          destination: unusedReceivingAddress,
        })
        setTotalFeeCrypto(transaction.JSONRepresentation.fee.decimal)
        setFeeLoading(false)
      }
    }
    buildTransaction()
  }, [transaction_conditions, transactionInformation, client, unusedAddresses])

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const createTransaction = async (transactionInfo) => {
    setTransactionInformation(transactionInfo)
  }

  const confirmMlTransaction = async () => {
    const unusedReceivingAddress = unusedAddresses.receive

    const result = await client.delegationCreate({
      pool_id: transactionInformation.to,
      destination: unusedReceivingAddress,
    })

    if (result) {
      await fetchDelegations()
    }

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
          {!transaction_conditions && (
            <Error error="Insufficient funds for the fee. Please wait for the wallet to sync or add coins to the wallet." />
          )}
        </VerticalGroup>
      </div>
    </>
  )
}

export default CreateDelegationPage
