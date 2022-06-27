import { useState, useEffect } from 'react'
import Header from '../../commons/components/advanced/header'
import Balance from '../../commons/components/balance/balance'
import SortButton from '../../commons/components/sort-button/sortButton'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import TransactionsList from '../../commons/components/transactions-list/transactionsList'
import {
  getParsedTransactions,
  calculateBalanceFromUtxoList,
} from '../../commons/crypto/btc'
import { getAddressTransactions } from '../../commons/api/electrum'
import './transactions.css'

const TransactionsPage = () => {
  const [transactionsList, setTransactionsList] = useState([])
  const getTransactions = async () => {
    try {
      const responce = await getAddressTransactions(
        'n3GNqMveyvaPvUbH469vDRadqpJMPc84JA',
      )
      const transactions = JSON.parse(responce)
      const parsedTransactions = getParsedTransactions(
        transactions,
        'n3GNqMveyvaPvUbH469vDRadqpJMPc84JA',
      )
      setTransactionsList(parsedTransactions)
    } catch (error) {
      console.log(error, 'error')
    }
  }

  const balance = calculateBalanceFromUtxoList(transactionsList)

  useEffect(() => {
    getTransactions()
  }, [setTransactionsList])
  return (
    <div data-testid="transactions-page">
      <VerticalGroup bigGap>
        <Header />
        <div className="balance-sort-wrapper">
          <Balance balance={balance} />
          <div className="sort-buttons-wrapper">
            <SortButton
              title={'Send'}
              up
            />
            <SortButton title={'Receive'} />
          </div>
        </div>
        <TransactionsList transactionsList={transactionsList} />
      </VerticalGroup>
    </div>
  )
}
export default TransactionsPage
