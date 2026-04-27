import { useEffect, useState } from 'react'
import { Button } from '@BasicComponents'
import OrderItem from '../OrderItem/OrderItem'
import OrderItemSkeleton from '../OrderItem/OrderItemSkeleton'
import styles from './OrderList.module.css'

const PAGE_SIZE = 10
const SKELETON_ROWS = 6

const OrderList = ({ orderList, ordersLoading }) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showedOrders, setShowedOrders] = useState([])

  useEffect(() => {
    orderList && setShowedOrders(orderList.slice(0, visibleCount))
  }, [visibleCount, orderList])

  const renderSkeletonRows = () =>
    Array.from({ length: SKELETON_ROWS }, (_, i) => (
      <OrderItemSkeleton key={i} />
    ))

  const renderOrders = () => {
    if (!orderList || !orderList.length) {
      return (
        <tr
          className={styles.emptyRow}
          data-testid="order-empty"
        >
          <td
            colSpan="4"
            className={styles.noOrders}
          >
            No orders found
          </td>
        </tr>
      )
    }

    return showedOrders.map((order, index) => (
      <OrderItem
        key={index}
        order={order}
      />
    ))
  }

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  return (
    <div
      className={styles.card}
      data-testid="order-list"
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={`${styles.colHeader} ${styles.colOrderId}`}>
              ORDER ID
            </th>
            <th className={`${styles.colHeader} ${styles.colSend}`}>
              YOU SEND
            </th>
            <th className={`${styles.colHeader} ${styles.colGet}`}>YOU GET</th>
            <th className={`${styles.colHeader} ${styles.colAction}`}></th>
          </tr>
        </thead>
        <tbody>{ordersLoading ? renderSkeletonRows() : renderOrders()}</tbody>
      </table>
      {!ordersLoading &&
        orderList &&
        showedOrders.length < orderList.length && (
          <div
            className={styles.loadMoreWrapper}
            data-testid="load-more-button"
          >
            <Button onClickHandle={handleLoadMore}>Load more</Button>
          </div>
        )}
    </div>
  )
}

export default OrderList
