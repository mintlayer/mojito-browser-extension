import { useContext } from 'react'
import Transaction from './Transaction'
import { MintlayerContext } from '@Contexts'
import { SkeletonLoader, EmptyListMessage } from '@BasicComponents'
import './TransactionsList.css'

const TransactionsList = ({ transactionsList, getConfirmations }) => {
  const { fetchingTransactions } = useContext(MintlayerContext)

  const transactionsLoading =
    fetchingTransactions && transactionsList.length === 0

  const renderSkeletonLoaders = () =>
    Array.from({ length: 6 }, (_, i) => <SkeletonLoader key={i} />)

  const renderTransactions = () => {
    if (!transactionsList || !transactionsList.length) {
      return <EmptyListMessage message={'No transactions in this wallet'} />
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
