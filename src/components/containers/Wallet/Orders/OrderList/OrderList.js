import { useEffect, useState } from 'react'
import { Button } from '@BasicComponents'
import OrderItem from '../OrderItem/OrderItem'
import { SkeletonLoader } from '@BasicComponents'
import './OrderList.css'

const PAGE_SIZE = 10

const OrderList = ({ orderList, ordersLoading }) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showedOrders, setShowedOrders] = useState([])

  useEffect(() => {
    orderList && setShowedOrders(orderList.slice(0, visibleCount))
  }, [visibleCount, orderList])

  const renderSkeletonLoaders = () =>
    Array.from({ length: 6 }, (_, i) => <SkeletonLoader key={i} />)

  const renderOrders = () => {
    if (!orderList || !orderList.length) {
      return (
        <li
          className="empty-list"
          data-testid="order-empty"
        >
          No orders found
        </li>
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
    <>
      <ul
        className="order-list"
        data-testid={'order-list'}
      >
        {ordersLoading ? renderSkeletonLoaders() : renderOrders()}
        {orderList && showedOrders.length < orderList.length && (
          <div
            className="load-more-button-wrapper"
            data-testid="load-more-button"
          >
            <Button onClickHandle={handleLoadMore}>Load more</Button>
          </div>
        )}
      </ul>
    </>
  )
}

export default OrderList
