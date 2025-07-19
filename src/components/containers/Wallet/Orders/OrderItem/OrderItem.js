import React, { useState } from 'react'

import { PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'
import { ReactComponent as SwapIcon } from '@Assets/images/icon-swap.svg'

import OrderDetails from '../OrderDetails/OrderDetails'

import './OrderItem.css'

const OrderItem = ({ order }) => {
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)

  const orderClickHandle = () => {
    setDetailPopupOpen(true)
  }

  return (
    <li
      className={'transaction'}
      data-testid="order"
      onClick={orderClickHandle}
    >
      <div
        className={'transaction-logo-type transaction-logo-out delegation-icon'}
      >
        <SwapIcon
          className={'order-swap-icon'}
          data-testid="swap-icon"
        />
      </div>
      <div className="transaction-detail">
        <div>
          <p
            className="transaction-id-info"
            data-testid="order-id"
          >
            {ML.formatAddress(order.order_id)}
          </p>
          <div className="transaction-date-amount">
            <div>
              <span>{order.ask_balance.decimal} </span>
              <span>{order.ask_currency.ticker}</span>
            </div>
            <SwapIcon
              className={'balance-swap-icon'}
              data-testid="swap-icon"
            />
            <div>
              <span>{order.give_balance.decimal} </span>
              <span>{order.give_currency.ticker}</span>
            </div>
          </div>
        </div>
      </div>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <OrderDetails order={order} />
        </PopUp>
      )}
    </li>
  )
}

export default OrderItem
