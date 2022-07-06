import './transactionDetails.css'
import { format } from 'date-fns'
import Button from '../basic/button'
import VerticalGroup from '../group/verticalGroup'
import { BTC_NETWORK } from '../../../environmentVars'

const TransactionDetailsItem = ({ title, content }) => {
  return (
    <div
      className="transaction-details-item"
      data-testid="transaction-details-item"
    >
      <h2 data-testid="transaction-details-item-title">{title}</h2>
      <p data-testid="transaction-details-item-content">{content}</p>
    </div>
  )
}

const TransactionDetails = ({ transaction }) => {
  const date = format(new Date(transaction?.date * 1000), 'dd/MM/yyyy')
  const buttonExtraStyles = ['transaction-details-button']
  const adressTitle = transaction?.direction === 'out' ? 'To:' : 'From:'
  const transactionAddress = transaction?.otherPart?.join('; ')
  const externalLink = `https://www.blockchain.com/btc-${BTC_NETWORK}/tx/${transaction?.txid}`

  return (
    <div
      className="transaction-details"
      data-testid="transaction-details"
    >
      <VerticalGroup>
        <TransactionDetailsItem
          title={adressTitle}
          content={transactionAddress}
          data-testid="transaction-address"
        />
        <div className="details-date-amount">
          <TransactionDetailsItem
            title={'Date:'}
            content={date}
          />
          <TransactionDetailsItem
            title={'Amount:'}
            content={transaction?.value}
          />
        </div>
        <TransactionDetailsItem
          title={'Tx:'}
          content={transaction.txid}
        />
        <TransactionDetailsItem
          title={'Confirmations:'}
          content={'100'}
        />
        <a
          href={externalLink}
          target="_blank"
        >
          <Button extraStyleClasses={buttonExtraStyles}>
            Open In Blockchain
          </Button>
        </a>
      </VerticalGroup>
    </div>
  )
}

export { TransactionDetailsItem }

export default TransactionDetails
