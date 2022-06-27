import './transaction.css'
import { ReactComponent as ArrowIcon } from '../../assets/img/icon-arrow.svg'
import { format } from 'date-fns'

const Transaction = ({ transaction }) => {
  const date = format(new Date(transaction.date * 1000), 'yyyy-MM-dd')
  return (
    <li
      className="transaction"
      data-testid={'transaction'}
    >
      <div
        className={`transaction-logo-type ${
          transaction.direction === 'out' && 'transaction-logo-out'
        }`}
        data-testid={'transaction-icon'}
      >
        <ArrowIcon
          className={`arrow-icon ${
            transaction.direction === 'out' && 'arrow-icon-out'
          }`}
        />
      </div>
      <div className="transaction-detail">
        <p
          className="transaction-id"
          data-testid={'transaction-txid'}
        >
          {transaction && transaction.txid}
        </p>
        <div className="transaction-date-amout">
          <p
            className="transaction-date"
            data-testid={'transaction-date'}
          >
            Date: <span>{date}</span>
          </p>
          <p
            className="transaction-amout"
            data-testid={'transaction-amout'}
          >
            Amout: <span>{transaction && transaction.value}</span>
          </p>
        </div>
      </div>
    </li>
  )
}

export default Transaction
