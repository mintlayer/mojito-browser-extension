import { useState, useEffect, useContext, useCallback } from 'react'
import Header from '../../commons/components/advanced/header'
import Balance from '../../commons/components/balance/balance'
import TransactionButton from '../../commons/components/transaction-button/transactionButton'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import TransactionsList from '../../commons/components/transactions-list/transactionsList'
import {
  getParsedTransactions,
  calculateBalanceFromUtxoList,
} from '../../commons/crypto/btc'
import { getAddressTransactions } from '../../commons/api/electrum'
import { Context } from '../../ContextProvider'
import './wallet.css'

const WalletPage = () => {
  const { btcAddress } = useContext(Context)
  console.log(btcAddress)
  const [transactionsList, setTransactionsList] = useState([])
  const getTransactions = useCallback(async () => {
      try {
        const response = await getAddressTransactions(btcAddress)
        const transactions = JSON.parse(response)
        const parsedTransactions = getParsedTransactions(transactions, btcAddress)
        setTransactionsList(parsedTransactions)
      } catch (error) {
        console.log(error, 'error')
      }
    }, [btcAddress])

  const balance = calculateBalanceFromUtxoList(transactionsList)

  useEffect(() => {
    getTransactions()
  }, [getTransactions])

  return (
    <div data-testid="wallet-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-transactions-wrapper">
          <Balance balance={balance} />
          <div className="transactions-buttons-wrapper">
            <TransactionButton
              title={'Send'}
              up
            />
            <TransactionButton title={'Receive'} />
          </div>
        </div>
        <TransactionsList transactionsList={transactionsList} />
      </VerticalGroup>
    </div>
  )
}
export default WalletPage
