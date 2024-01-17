import { useContext } from 'react'
import Transaction from './Transaction'
import { AccountContext } from '@Contexts'
import { SkeletonLoader } from '@BasicComponents'
import './TransactionsList.css'

const TransactionsList = ({ transactionsList, getConfirmations }) => {
  const { transactionsLoading } = useContext(AccountContext)

  const renderSkeletonLoaders = () =>
    Array.from({ length: 3 }, (_, i) => <SkeletonLoader key={i} />)

  const renderTransactions = () => {
    if (!transactionsList || !transactionsList.length) {
      return (
        <li
          className="empty-list"
          data-testid="transaction"
        >
          No transactions in this wallet
        </li>
      )
    }

    return transactionsList.map((transaction, index) => (
      <Transaction
        key={index}
        transaction={transaction}
        getConfirmations={getConfirmations}
      />
    ))
  }

  return (
    <ul
      className="transaction-list"
      data-testid={'transactions-list'}
    >
      {transactionsLoading ? renderSkeletonLoaders() : renderTransactions()}
    </ul>
  )
}

export default TransactionsList
