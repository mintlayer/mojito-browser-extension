import './transaction.css'
import { ReactComponent as ArrowIcon } from '../../assets/img/icon-arrow.svg'
import { format } from 'date-fns'

const Transaction = ({ transaction }) => {
  const date = format(new Date(transaction.date * 1000), 'dd/MM/yyyy')

  const formatAddress = (address) => {
    const limitSize = 24
    const halfLimit = limitSize / 2
    const firstPart = address.slice(0, halfLimit)
    const lastPart = address.slice(address.length - halfLimit, address.length)
    return `${firstPart}...${lastPart}`
  }

  return (
    <li
      className="transaction"
      data-testid="transaction"
    >
      <div
        className={`transaction-logo-type ${
          transaction.direction === 'out' && 'transaction-logo-out'
        }`}
        data-testid="transaction-icon"
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
          data-testid="transaction-otherPart"
        >
          {transaction && formatAddress(transaction.otherPart[0])}
          {transaction &&
            transaction.otherPart.length > 1 &&
            ` (+${transaction.otherPart.length - 1})`}
        </p>
        <div className="transaction-date-amout">
          <p
            className="transaction-date"
            data-testid="transaction-date"
          >
            Date: <span>{date}</span>
          </p>
          <p
            className="transaction-amout"
            data-testid="transaction-amout"
          >
            Amout: <span>{transaction && transaction.value}</span>
          </p>
        </div>
      </div>
    </li>
  )
}

export default Transaction