import { useEffect, useState, useContext } from 'react'
import { format } from 'date-fns'

import { Button } from '@BasicComponents'
import { Loading } from '@ComposedComponents'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'
import TransactionAmount from './TransactionAmount'

import './TransactionDetails.css'
import { useParams } from 'react-router-dom'
import { CenteredLayout } from '@LayoutComponents'

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

  const { coinType } = useParams()
  const walletType = {
    name: coinType,
    ticker: coinType === 'Bitcoin' ? 'BTC' : 'ML',
    chain: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

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

  const externalMlLink = `https://${
    isTestnet ? 'lovelace.' : ''
  }explorer.mintlayer.org/tx/${transaction?.txid}`

  const explorerLink =
    walletType.name === 'Bitcoin' ? externalBtcLink : externalMlLink

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
        {transaction.type === 'FillOrder' && (
          <>
            <TransactionDetailsItem
              title={'Transaction type:'}
              content={'Swap'}
              data-testid="transaction-type"
            />
            <TransactionDetailsItem
              title={'Order ID:'}
              content={transaction.order_id}
              data-testid="transaction-order-id"
            />
          </>
        )}
        {transaction.type === 'CreateOrder' && (
          <>
            <TransactionDetailsItem
              title={'Transaction type:'}
              content={'Swap'}
              data-testid="transaction-type"
            />
          </>
        )}

        {transaction.type !== 'FillOrder' && (
          <TransactionDetailsItem
            title={addressTitle}
            content={transactionAddress}
            data-testid="transaction-address"
          />
        )}
        <TransactionDetailsItem
          title={'Date:'}
          content={date}
        />
        <TransactionDetailsItem
          title={'Amount:'}
          content={
            <TransactionAmount
              transaction={transaction}
              extraStyleClasses={['transaction-amount-big']}
            />
          }
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
      <CenteredLayout>
        <a
          href={explorerLink}
          target="_blank"
        >
          <Button extraStyleClasses={buttonExtraStyles}>
            Open In Block Explorer
            <IconArrowTopRight className="transaction-explorer-button-icon" />
          </Button>
        </a>
      </CenteredLayout>
    </div>
  )
}

export { TransactionDetailsItem }

export default TransactionDetails
