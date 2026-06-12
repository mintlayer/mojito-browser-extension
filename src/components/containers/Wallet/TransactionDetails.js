import { useEffect, useState, useContext } from 'react'
import { format } from 'date-fns'

import { Button } from '@BasicComponents'
import { Loading, CopyButton } from '@ComposedComponents'
import { SettingsContext, MintlayerContext } from '@Contexts'
import { ML, BTC, Format } from '@Helpers'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as SwapIcon } from '@Assets/images/icon-swap.svg'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'
import { ReactComponent as IconSuccess } from '@Assets/images/icon-success.svg'

import styles from './TransactionDetails.module.css'
import { useParams } from 'react-router'

const formatDate = (timestamp) => {
  if (!timestamp) return 'not confirmed'
  const txDate = new Date(timestamp * 1000)
  const now = new Date()
  const isToday =
    txDate.getDate() === now.getDate() &&
    txDate.getMonth() === now.getMonth() &&
    txDate.getFullYear() === now.getFullYear()
  if (isToday) return `Today, ${format(txDate, 'HH:mm')}`
  return format(txDate, 'dd/MM/yyyy HH:mm')
}

const getAddress = (tx) =>
  tx.direction === 'out'
    ? tx.destAddress || tx.to?.[0] || 'N/A'
    : tx.destAddress || tx.from?.[0] || 'N/A'

const TransactionDetailsItem = ({ title, content }) => {
  return (
    <div
      className={styles.detailRow}
      data-testid="transaction-details-item"
    >
      <span
        className={styles.detailLabel}
        data-testid="transaction-details-item-title"
      >
        {title}
      </span>
      <div
        className={styles.detailValue}
        data-testid="transaction-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const TransactionDetails = ({ transaction, getConfirmations }) => {
  const { networkType } = useContext(SettingsContext)
  const { tokenMap, tokenBalances } = useContext(MintlayerContext)

  const { coinType } = useParams()
  const isToken = !['Bitcoin', 'Mintlayer'].includes(coinType)
  const walletType = {
    name: coinType,
    ticker:
      coinType === 'Bitcoin'
        ? 'BTC'
        : isToken
          ? tokenBalances[coinType]?.token_info?.token_ticker?.string ||
            tokenMap[coinType] ||
            coinType
          : 'ML',
    chain: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

  const [confirmations, setConfirmations] = useState(null)

  const date = formatDate(transaction.date)
  const isReceive = transaction.direction === 'in'
  const addressTitle = isReceive ? 'From' : 'To'
  const transactionAddress = getAddress(transaction)
  const directionLabel = (() => {
    switch (transaction.type) {
      case 'CreateOrder':
      case 'FillOrder':
        return 'Swap'
      case 'CreateStakePool':
        return 'Create Stake Pool'
      case 'CreateDelegationId':
        return 'Create Delegation'
      case 'DelegateStaking':
        return 'Delegate Staking'
      case 'Delegate Withdrawal':
        return 'Delegation Withdrawal'
      default:
        return isReceive ? 'Receive' : 'Send'
    }
  })()
  const isSwap =
    transaction.type === 'FillOrder' || transaction.type === 'CreateOrder'
  const amountSign = isReceive ? '+' : '-'
  const formattedValue = transaction.value
    ? Format.BTCValue(transaction.value)
    : '0'

  const externalBtcLink = BTC.getBtcTransactionLink(
    transaction?.txid,
    networkType,
  )
  const externalMlLink = ML.getMlTransactionLink(transaction?.txid, networkType)
  const explorerLink =
    walletType.name === 'Bitcoin' ? externalBtcLink : externalMlLink
  const explorerName =
    walletType.name === 'Bitcoin' ? 'Block Explorer' : 'Mintlayer Explorer'

  const isConfirmed = confirmations !== null && confirmations !== 0

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
      className={styles.transactionDetails}
      data-testid="transaction-details"
    >
      <div
        className={`${styles.banner} ${isSwap ? styles.bannerSwap : !isReceive ? styles.bannerOut : ''}`}
      >
        <div
          className={`${styles.bannerIcon} ${isSwap ? styles.bannerIconSwap : !isReceive ? styles.bannerIconOrange : ''}`}
        >
          {isSwap ? (
            <SwapIcon />
          ) : (
            <ArrowIcon
              className={!isReceive ? styles.bannerIconOut : undefined}
            />
          )}
        </div>
        <span className={styles.bannerDirection}>{directionLabel}</span>
        {isSwap ? (
          <div className={styles.bannerSwapAmount}>
            <div className={styles.bannerSwapSide}>
              <span className={styles.bannerAmountValue}>
                {transaction.value?.from?.amount || '0'}
              </span>
              <span className={styles.bannerTicker}>
                {tokenMap[transaction.value?.from?.token_id] || 'ML'}
              </span>
            </div>
            <SwapIcon className={styles.bannerSwapArrow} />
            <div className={styles.bannerSwapSide}>
              <span className={styles.bannerAmountValue}>
                {transaction.value?.to?.amount || '0'}
              </span>
              <span className={styles.bannerTicker}>
                {tokenMap[transaction.value?.to?.token_id] || 'ML'}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.bannerAmount} ${!isReceive ? styles.bannerAmountOut : ''}`}
          >
            <span className={styles.bannerAmountValue}>
              {amountSign}
              {formattedValue}
            </span>
            <span className={styles.bannerTicker}>{walletType.ticker}</span>
          </div>
        )}
        <div
          className={`${styles.bannerStatus} ${!isConfirmed ? styles.bannerStatusPending : ''}`}
        >
          {isConfirmed ? (
            <>
              <IconSuccess />
              Confirmed
            </>
          ) : confirmations === null ? (
            <Loading />
          ) : (
            'Pending'
          )}
        </div>
      </div>

      <div className={styles.detailsCard}>
        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Date</span>
          <span className={styles.detailValue}>{date}</span>
        </div>

        {transaction.type === 'FillOrder' && (
          <>
            <TransactionDetailsItem
              title="Transaction type"
              content="Swap"
            />
            <TransactionDetailsItem
              title="Order ID"
              content={transaction.order_id}
            />
          </>
        )}

        {transaction.type === 'CreateOrder' && (
          <TransactionDetailsItem
            title="Transaction type"
            content="Swap"
          />
        )}

        {transaction.type !== 'FillOrder' && (
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>{addressTitle}</span>
            <div className={styles.detailValue}>
              {ML.formatAddress(transactionAddress, 16)}
              <CopyButton content={transactionAddress} />
            </div>
          </div>
        )}

        <div className={styles.detailRow}>
          <span className={styles.detailLabel}>Confirmations</span>
          <span className={`${styles.detailValue} ${styles.detailValueGreen}`}>
            {confirmations || confirmations === 0 ? confirmations : <Loading />}
          </span>
        </div>
      </div>

      <div className={styles.hashSection}>
        <span className={styles.hashLabel}>Transaction hash</span>
        <div className={styles.hashBox}>
          <span className={styles.hashValue}>{transaction.txid}</span>
          <CopyButton content={transaction.txid} />
        </div>
      </div>

      <a
        href={explorerLink}
        target="_blank"
        rel="noreferrer"
      >
        <Button
          extraStyleClasses={[styles.detailsButton]}
          alternate
        >
          <IconArrowTopRight />
          View on {explorerName}
        </Button>
      </a>
    </div>
  )
}

export { TransactionDetailsItem }

export default TransactionDetails
