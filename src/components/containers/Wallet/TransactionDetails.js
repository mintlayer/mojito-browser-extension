import { useEffect, useState, useContext } from 'react'
import { format } from 'date-fns'

import { Format } from '@Helpers'
import { Button } from '@BasicComponents'
import { Loading } from '@ComposedComponents'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './TransactionDetails.css'

const TransactionDetailsItem = ({ title, content }) => {
  return (
    <div
      className="transaction-details-item"
      data-testid="transaction-details-item"
    >
      <h2 data-testid="transaction-details-item-title">{title}</h2>
      <div
        className="transactionDetItemContent"
        data-testid="transaction-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const TransactionDetails = ({ transaction, getConfirmations }) => {
  const { networkType } = useContext(SettingsContext)
  const [confirmations, setConfirmations] = useState(null)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const date = transaction.date
    ? format(new Date(transaction.date * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'
  const buttonExtraStyles = ['transaction-details-button']
  const addressTitle = transaction?.direction === 'out' ? 'To:' : 'From:'
  const transactionAddress =
    transaction.destAddress || [...new Set(transaction?.otherPart)].join('; ')
  const externalBtcLink = `https://blockstream.info${
    isTestnet ? '/testnet' : ''
  }/tx/${transaction?.txid}`
  // TODO: add Mintlayer explorer link

  useEffect(() => {
    const getConfirmationAmount = async () => {
      const amount =
        (await getConfirmations(transaction)) || transaction.confirmations
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
        <TransactionDetailsItem
          title={'Date:'}
          content={date}
        />
        <TransactionDetailsItem
          title={'Amount:'}
          content={Format.BTCValue(transaction.value)}
        />
        <TransactionDetailsItem
          title={'Tx:'}
          content={transaction.txid}
        />
        <TransactionDetailsItem
          title={'Confirmations:'}
          content={
            confirmations || confirmations === 0 ? confirmations : <Loading />
          }
        />
      </div>
      <a
        href={externalBtcLink}
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
