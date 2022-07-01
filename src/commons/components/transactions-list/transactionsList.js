import Transaction from '../transaction/transaction'
import './transactionsList.css'

const TransactionsList = ({ transactionsList }) => {
  return (
    <ul
      className="transaction-list"
      data-testid={'transactions-list'}
    >
      {(!transactionsList ||
        !transactionsList.length)
        ? (
          <li className="empty-list">
            No transactions in this wallet
          </li>
        )
        : (
          transactionsList.map((transaction, index) => (
            <Transaction
              key={index}
              transaction={transaction}
            />
          ))
        )
      }
    </ul>
  )
}

export default TransactionsList
