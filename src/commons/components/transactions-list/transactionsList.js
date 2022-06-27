import './transactionsList.css'
import Transaction from '../transaction/transaction'

const TransactionsList = ({ transactionsList }) => {
  return (
    <ul
      className="transaction-list"
      data-testid={'transactions-list'}
    >
      {transactionsList &&
        transactionsList.length > 0 &&
        transactionsList.map((transaction, index) => (
          <Transaction
            key={index}
            transaction={transaction}
          />
        ))}
    </ul>
  )
}

export default TransactionsList
