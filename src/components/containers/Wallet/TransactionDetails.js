import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import { EnvVars } from '@Constants'
import { BTC } from '@Cryptos'
import { Button } from '@BasicComponents'
import { Loading } from '@ComposedComponents'

import './TransactionDetails.css'

const TransactionDetailsItem = ({ title, content }) => {
  return (
    <div
      className="transaction-details-item"
      data-testid="transaction-details-item"
    >
      <h2 data-testid="transaction-details-item-title">{title}</h2>
      <div
        className="transactionDeyItemContent"
        data-testid="transaction-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const TransactionDetails = ({
  transaction,
  getConfirmationsFn = BTC.getConfirmationsAmount,
}) => {
  const [confirmations, setConfirmations] = useState(null)

  const date = format(new Date(transaction?.date * 1000), 'dd/MM/yyyy HH:mm')
  const buttonExtraStyles = ['transaction-details-button']
  const adressTitle = transaction?.direction === 'out' ? 'To:' : 'From:'
  const transactionAddress = transaction?.otherPart?.join('; ')
  const externalLink = `https://www.blockchain.com/btc-${EnvVars.BTC_NETWORK}/tx/${transaction?.txid}`

  useEffect(() => {
    const getConfirmations = async () => {
      const amount = await getConfirmationsFn(transaction)
      setConfirmations(amount)
    }
    getConfirmations()
  }, [transaction, getConfirmationsFn])

  return (
    <div
      className="transaction-details"
      data-testid="transaction-details"
    >
      <div className="transaction-details-items-wrapper">
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
          content={confirmations ? confirmations : <Loading />}
        />
      </div>
      <a
        href={externalLink}
        target="_blank"
      >
        <Button extraStyleClasses={buttonExtraStyles}>
          Open In Blockchain
        </Button>
      </a>
    </div>
  )
}

export { TransactionDetailsItem }

export default TransactionDetails
