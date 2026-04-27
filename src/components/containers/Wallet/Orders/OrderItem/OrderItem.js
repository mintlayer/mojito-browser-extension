import { useState } from 'react'
import Decimal from 'decimal.js'

import { PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'

import OrderDetails from '../OrderDetails/OrderDetails'

import styles from './OrderItem.module.css'

const formatRate = (rate) => new Decimal(rate).toDecimalPlaces(10).toString()

const OrderItem = ({ order }) => {
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)

  const orderClickHandle = () => {
    setDetailPopupOpen(true)
  }

  const askTicker = order.ask_currency.ticker
  const giveTicker = order.give_currency.ticker
  const rateText =
    order.quote_rate != null
      ? `1 ${askTicker} = ${formatRate(order.quote_rate)} ${giveTicker}`
      : null

  return (
    <>
      <tr
        className={styles.row}
        data-testid="order"
        onClick={orderClickHandle}
      >
        <td className={styles.orderIdCell}>
          <span
            className={styles.orderId}
            data-testid="order-id"
          >
            {ML.formatAddress(order.order_id)}
          </span>
          {rateText && <span className={styles.exchangeRate}>{rateText}</span>}
        </td>
        <td className={styles.amountCell}>
          <span className={styles.amount}>{order.ask_balance.decimal}</span>
          <span className={styles.ticker}>{askTicker}</span>
        </td>
        <td className={styles.amountCell}>
          <span className={`${styles.amount} ${styles.amountGreen}`}>
            {order.give_balance.decimal}
          </span>
          <span className={styles.ticker}>{giveTicker}</span>
        </td>
        <td className={styles.chevronCell}>
          <span className={styles.chevron}>&rsaquo;</span>
        </td>
      </tr>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <OrderDetails order={order} />
        </PopUp>
      )}
    </>
  )
}

export default OrderItem
