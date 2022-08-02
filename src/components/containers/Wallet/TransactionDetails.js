import { useEffect, useState } from 'react'
import { format } from 'date-fns'

import { Format } from '@Helpers'
import { EnvVars } from '@Constants'
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

const TransactionDetails = ({ transaction, getConfirmations }) => {
  const [confirmations, setConfirmations] = useState(null)

  const date = format(new Date(transaction?.date * 1000), 'dd/MM/yyyy HH:mm')
  const buttonExtraStyles = ['transaction-details-button']
  const addressTitle = transaction?.direction === 'out' ? 'To:' : 'From:'
  const transactionAddress = [...new Set(transaction?.otherPart)].join('; ')
  const externalLink = `https://www.blockchain.com/btc-${EnvVars.BTC_NETWORK}/tx/${transaction?.txid}`

  useEffect(() => {
    const getConfirmationAmount = async () => {
      const amount = await getConfirmations(transaction)
      setConfirmations(amount)
    }
    getConfirmationAmount()
  }, [transaction, getConfirmations])

  return (
    <div
      className="transaction-details"
      data-testid="transaction-details"
    >
      <div className="transaction-details-items-wrapper">
        <TransactionDetailsItem
          title={addressTitle}
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
            content={Format.BTCValue(transaction.value)}
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
