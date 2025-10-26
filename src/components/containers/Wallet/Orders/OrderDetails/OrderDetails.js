import React, { useContext, useState } from 'react'
import { Button, Error, SwapTokenLogo } from '@BasicComponents'
import { CopyButton } from '@ComposedComponents'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-swap.svg'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ML } from '@Helpers'

import { MintlayerContext, AccountContext } from '@Contexts'

import './OrderDetails.css'
import { Loading, TextField } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

const OrderDetailsItem = ({ title, content, copyContent }) => {
  return (
    <div
      className={'order-details-item'}
      data-testid="order-details-item"
    >
      {title && <h2 data-testid="order-details-item-title">{title}</h2>}
      <div
        className="order-details-content"
        data-testid="order-details-item-content"
      >
        {content}
        {copyContent && <CopyButton content={copyContent} />}
      </div>
    </div>
  )
}

const SwapInfoContent = ({ order, from }) => {
  const tokenId = from
    ? order.ask_currency.token_id
    : order.give_currency.token_id
  const tokenTicker = from
    ? order.ask_currency.ticker
    : order.give_currency.ticker
  return (
    <div
      className="token-info-content"
      data-testid="token-info-content"
    >
      <SwapTokenLogo
        tokenId={tokenId}
        ticker={tokenTicker}
        size="big"
      />
      <div
        className="token-info-content-text"
        data-testid="token-info-text"
      >
        <p
          className="token-info-content-amount"
          data-testid="token-amount"
        >
          {from
            ? `${order.ask_balance.decimal} ${order.ask_currency.type === 'Coin' ? 'ML' : order.ask_currency.ticker}`
            : `${order.give_balance.decimal} ${order.give_currency.type === 'Coin' ? 'ML' : order.give_currency.ticker}`}
        </p>
        <p
          className="token-info-content-id"
          data-testid="token-id"
        >
          {from
            ? `${order.ask_currency.type === 'Token' ? `(${order.ask_currency.token_id})` : '(Mintlayer Coin)'}`
            : `${order.give_currency.type === 'Token' ? `(${order.give_currency.token_id})` : '(Mintlayer Coin)'}`}
        </p>
      </div>
    </div>
  )
}

const OrderDetails = ({ order }) => {
  const buttonExtraStyles = ['order-details-button']
  const inputExtraClasses = ['order-details-input']
  const { client } = useContext(MintlayerContext)
  const { addresses } = useContext(AccountContext)

  const requiredAddresses = addresses.mlAddresses
  const [txErrorMessage, setTxErrorMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const loadingExtraClasses = ['loading-big']

  const [amount, setAmount] = useState('')
  const [amountValidity, setAmountValidity] = useState(false)

  const amountChangeHandler = (value) => {
    setAmount(value)
    setAmountValidity(
      value &&
        !isNaN(value) &&
        parseFloat(value) > 0 &&
        parseFloat(value) <= Number(order.ask_balance.decimal),
    )
  }

  const handleSwapClick = async () => {
    setTxErrorMessage(null)
    if (!amountValidity) {
      setTxErrorMessage('Amount is invalid')
      return
    }
    try {
      setLoading(true)
      if (order) {
        await client.fillOrder({
          order_id: order.order_id,
          amount,
          destination: requiredAddresses[0],
        })
      }
    } catch (error) {
      if (typeof error === 'string') {
        if (error?.message?.includes('Not enough token UTXOs')) {
          setTxErrorMessage('Token blance is not enough to fill the order')
          return
        }

        if (error?.message?.includes('Failed to fetch order')) {
          setTxErrorMessage('Order not found or invalid order ID')
          return
        }

        if (error?.message?.includes('Invalid addressable')) {
          setTxErrorMessage('Invalid destination address')
          return
        }

        if (error.includes('Invalid addressable')) {
          setTxErrorMessage('Invalid destination address')
          return
        }
      }

      console.error('Error filling order:', error)
      setTxErrorMessage(
        error?.message || 'An error occurred while filling the order',
      )
    } finally {
      setLoading(false)
    }
  }
  return (
    <div
      className="order-details"
      data-testid="order-details"
    >
      {loading ? (
        <div className="swap-order-loading">
          <Loading extraStyleClasses={loadingExtraClasses} />
        </div>
      ) : (
        <>
          <div className="order-details-items-wrapper">
            <OrderDetailsItem
              title={'Order id:'}
              content={ML.formatAddress(order.order_id, 36)}
              copyContent={order.order_id}
            />
            <div className="order-details-swap-row">
              <OrderDetailsItem
                title={''}
                content={
                  <SwapInfoContent
                    order={order}
                    from
                  />
                }
              />
              <div className="swap-arrow-row">
                <Button extraStyleClasses={['details-swap-arrow-button']}>
                  <ArrowIcon className="details-icon-arrow-swap" />
                </Button>
              </div>
              <OrderDetailsItem
                title={''}
                content={<SwapInfoContent order={order} />}
              />
            </div>
            <div className="order-details-exchange-rate">
              <span>Exchage rate:</span>
              <span>
                {` 1 ${order.ask_currency.ticker} ≈ ${Number(order.quote_rate).toFixed(10)} ${order.give_currency.ticker}`}
              </span>
            </div>
          </div>
          <CenteredLayout grow>
            <VerticalGroup grow>
              {txErrorMessage ? (
                <>
                  <Error error={txErrorMessage} />
                </>
              ) : (
                <></>
              )}
              <div className="order-details-inputs-wrapper">
                <TextField
                  value={amount}
                  onChangeHandle={amountChangeHandler}
                  validity={amountValidity}
                  placeHolder={`${order.ask_currency.type === 'Coin' ? 'ML' : order.ask_currency.ticker} amount`}
                  extraStyleClasses={inputExtraClasses}
                  bigGap={false}
                  focus={false}
                />
                <Button
                  extraStyleClasses={buttonExtraStyles}
                  onClickHandle={handleSwapClick}
                >
                  Swap
                  <IconArrowTopRight className="order-details-button-icon" />
                </Button>
              </div>
            </VerticalGroup>
          </CenteredLayout>
        </>
      )}
    </div>
  )
}

export { OrderDetailsItem, SwapInfoContent }

export default OrderDetails
