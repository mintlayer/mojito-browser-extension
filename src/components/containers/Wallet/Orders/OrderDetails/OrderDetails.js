import React, { useContext, useState } from 'react'
import Decimal from 'decimal.js'
import { Button, SwapTokenLogo } from '@BasicComponents'
import { CopyButton, Loading } from '@ComposedComponents'
import { CryptoFiatField } from '@ComposedComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-swap.svg'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ML } from '@Helpers'
import { useFillOrder } from '@Hooks'

import { MintlayerContext } from '@Contexts'

import formatRate from '../formatRate'

import styles from './OrderDetails.module.css'

const OrderDetailsItem = ({ title, content, copyContent }) => {
  return (
    <div
      className={styles.item}
      data-testid="order-details-item"
    >
      {title && (
        <h2
          className={styles.itemTitle}
          data-testid="order-details-item-title"
        >
          {title}
        </h2>
      )}
      <div
        className={styles.itemContent}
        data-testid="order-details-item-content"
      >
        <span className={styles.itemValue}>{content}</span>
        {copyContent && (
          <div className={styles.copyWrapper}>
            <CopyButton content={copyContent} />
          </div>
        )}
      </div>
    </div>
  )
}

const SwapInfoContent = ({ order, from }) => {
  const currency = from ? order.ask_currency : order.give_currency
  const balance = from ? order.ask_balance : order.give_balance
  const tokenId = currency.token_id
  const tokenTicker = currency.ticker
  const displayTicker = currency.type === 'Coin' ? 'ML' : currency.ticker
  const subtitle =
    currency.type === 'Token' ? `(${currency.token_id})` : '(Mintlayer Coin)'

  return (
    <div
      className={styles.swapCard}
      data-testid="token-info-content"
    >
      <SwapTokenLogo
        tokenId={tokenId}
        ticker={tokenTicker}
        size="big"
      />
      <div
        className={styles.swapCardText}
        data-testid="token-info-text"
      >
        <p
          className={styles.swapAmount}
          data-testid="token-amount"
        >
          <span className={styles.amountValue}>{balance.decimal}</span>{' '}
          <span className={styles.amountTicker}>{displayTicker}</span>
        </p>
        <p
          className={styles.swapTokenId}
          data-testid="token-id"
        >
          {subtitle}
        </p>
      </div>
      <span
        className={`${styles.badge} ${from ? styles.badgeFrom : styles.badgeTo}`}
      >
        {from ? 'FROM' : 'TO'}
      </span>
    </div>
  )
}

const OrderDetails = ({ order }) => {
  const { unusedAddresses, balance, tokenBalances } =
    useContext(MintlayerContext)
  const fillOrder = useFillOrder()
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const [txSuccessMessage, setTxSuccessMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [amountValidity, setAmountValidity] = useState(false)
  const [inputValidity, setInputValidity] = useState('')

  // Compare raw decimal strings: float math loses precision on 11-decimal
  // coin amounts.
  const maxAmount = new Decimal(order.ask_balance?.decimal || 0)

  const walletBalance =
    order.ask_currency.type === 'Coin'
      ? new Decimal(String(balance ?? 0))
      : tokenBalances[order.ask_currency.token_id]
        ? new Decimal(
            String(tokenBalances[order.ask_currency.token_id].balance),
          )
        : new Decimal(0)

  const handleValueChange = ({ value }) => {
    setAmount(value || '')
  }

  const handleAmountValidity = (valid) => {
    setAmountValidity(valid)
    setInputValidity(valid ? 'valid' : 'invalid')
    if (valid) setTxErrorMessage(null)
  }

  const validateAmount = (value) => {
    const valueDecimal = new Decimal(String(value || 0))
    if (valueDecimal.gt(walletBalance)) return 'Insufficient wallet balance.'
    if (valueDecimal.gt(maxAmount))
      return 'Amount exceeds available order balance.'
    return null
  }

  const handleSwapClick = async () => {
    setTxErrorMessage(null)
    setTxSuccessMessage(null)
    if (!amountValidity) {
      setTxErrorMessage('Amount is invalid')
      return
    }
    if (!unusedAddresses.receive) {
      setTxErrorMessage('Destination address is not available yet.')
      return
    }
    try {
      setLoading(true)
      await fillOrder({
        order_id: order.order_id,
        amount,
        destination: unusedAddresses.receive,
      })
      setAmount('')
      setAmountValidity(false)
      setInputValidity('')
      setTxSuccessMessage('Order filled successfully.')
    } catch (error) {
      const msg = typeof error === 'string' ? error : error?.message || ''

      if (msg.includes('Not enough token UTXOs')) {
        setTxErrorMessage('Token balance is not enough to fill the order')
        return
      }

      if (msg.includes('Could not fetch order')) {
        setTxErrorMessage('Order not found or invalid order ID')
        return
      }

      if (msg.includes('Invalid addressable')) {
        setTxErrorMessage('Invalid destination address')
        return
      }

      console.error('Error filling order:', error)
      setTxErrorMessage(msg || 'An error occurred while filling the order')
    } finally {
      setLoading(false)
    }
  }

  const placeholderTicker =
    order.ask_currency.type === 'Coin' ? 'ML' : order.ask_currency.ticker

  return (
    <div
      className={styles.container}
      data-testid="order-details"
    >
      {loading ? (
        <div className={styles.loadingWrapper}>
          <Loading extraStyleClasses={['loading-big']} />
        </div>
      ) : (
        <>
          <h1 className={styles.title}>Order details</h1>

          <OrderDetailsItem
            title={'Order id:'}
            content={ML.formatAddress(order.order_id, 36)}
            copyContent={order.order_id}
          />

          <div className={styles.swapCardWrapper}>
            <SwapInfoContent
              order={order}
              from
            />
            <div
              className={styles.arrowSeparator}
              aria-hidden="true"
            >
              <ArrowIcon className={styles.arrowIcon} />
            </div>
            <SwapInfoContent order={order} />
          </div>

          <div className={styles.exchangeRate}>
            <span>
              Exchange rate:{' '}
              {` 1 ${order.ask_currency.ticker} ≈ ${formatRate(order.quote_rate)} ${order.give_currency.ticker}`}
            </span>
            <p className={styles.walletBalance}>
              Available: {walletBalance.toString()} {placeholderTicker}
            </p>
          </div>

          <div className={styles.actions}>
            <CryptoFiatField
              inputValue={amount}
              placeholder={`${placeholderTicker} amount`}
              extraStyleClasses={[styles.amountInput]}
              transactionData={{
                tokenName: placeholderTicker,
                fiatName: 'USD',
              }}
              validity={inputValidity}
              changeValueHandle={handleValueChange}
              setAmountValidity={handleAmountValidity}
              totalFeeInCrypto={0}
              validate={validateAmount}
              setErrorMessage={setTxErrorMessage}
            />
            <Button
              extraStyleClasses={[styles.swapButton]}
              onClickHandle={handleSwapClick}
              disabled={!unusedAddresses.receive || loading}
            >
              <IconArrowTopRight className={styles.swapButtonIcon} />
              Swap
            </Button>
            {txErrorMessage ? (
              <p className={styles.errorMessage}>{txErrorMessage}</p>
            ) : txSuccessMessage ? (
              <p className={styles.successMessage}>{txSuccessMessage}</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}

export { OrderDetailsItem, SwapInfoContent }

export default OrderDetails
