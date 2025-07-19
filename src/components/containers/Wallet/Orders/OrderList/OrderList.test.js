import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import OrderList from './OrderList'

const mockOrders = [
  {
    order_id: 'order1',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN1' },
    ask_balance: { decimal: '100.0' },
    give_balance: { decimal: '200.0' },
  },
  {
    order_id: 'order2',
    ask_currency: { ticker: 'TKN2' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '50.75' },
    give_balance: { decimal: '25.125' },
  },
  {
    order_id: 'order3',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN3' },
    ask_balance: { decimal: '75.5' },
    give_balance: { decimal: '150.25' },
  },
  {
    order_id: 'order4',
    ask_currency: { ticker: 'TKN4' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '30.0' },
    give_balance: { decimal: '60.0' },
  },
  {
    order_id: 'order5',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN5' },
    ask_balance: { decimal: '25.25' },
    give_balance: { decimal: '50.50' },
  },
  {
    order_id: 'order6',
    ask_currency: { ticker: 'TKN6' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '40.75' },
    give_balance: { decimal: '20.125' },
  },
  {
    order_id: 'order7',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN7' },
    ask_balance: { decimal: '80.0' },
    give_balance: { decimal: '160.0' },
  },
  {
    order_id: 'order8',
    ask_currency: { ticker: 'TKN8' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '35.5' },
    give_balance: { decimal: '17.75' },
  },
  {
    order_id: 'order9',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN9' },
    ask_balance: { decimal: '90.25' },
    give_balance: { decimal: '180.50' },
  },
  {
    order_id: 'order10',
    ask_currency: { ticker: 'TKN10' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '45.0' },
    give_balance: { decimal: '22.5' },
  },
  {
    order_id: 'order11',
    ask_currency: { ticker: 'ML' },
    give_currency: { ticker: 'TKN11' },
    ask_balance: { decimal: '55.75' },
    give_balance: { decimal: '111.50' },
  },
  {
    order_id: 'order12',
    ask_currency: { ticker: 'TKN12' },
    give_currency: { ticker: 'ML' },
    ask_balance: { decimal: '65.25' },
    give_balance: { decimal: '32.625' },
  },
]

describe('OrderList', () => {
  it('renders empty state when no orders', () => {
    render(
      <OrderList
        orderList={[]}
        ordersLoading={false}
      />,
    )

    expect(screen.getByTestId('order-list')).toBeInTheDocument()
    expect(screen.getByTestId('order-empty')).toBeInTheDocument()
    expect(screen.getByText('No orders found')).toBeInTheDocument()
  })

  it('renders empty state when orderList is null', () => {
    render(
      <OrderList
        orderList={null}
        ordersLoading={false}
      />,
    )

    expect(screen.getByTestId('order-empty')).toBeInTheDocument()
    expect(screen.getByText('No orders found')).toBeInTheDocument()
  })

  it('renders empty state when orderList is undefined', () => {
    render(
      <OrderList
        orderList={undefined}
        ordersLoading={false}
      />,
    )

    expect(screen.getByTestId('order-empty')).toBeInTheDocument()
    expect(screen.getByText('No orders found')).toBeInTheDocument()
  })

  it('renders skeleton loaders when loading', () => {
    render(
      <OrderList
        orderList={[]}
        ordersLoading={true}
      />,
    )

    expect(screen.getByTestId('order-list')).toBeInTheDocument()
    // No orders should be rendered when loading
    expect(screen.queryAllByTestId('order')).toHaveLength(0)
  })

  it('renders skeleton loaders even with orders when loading', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={true}
      />,
    )

    // Should show skeleton loaders, not actual orders
    expect(screen.queryAllByTestId('order')).toHaveLength(0)
  })

  it('renders orders when not loading and orders exist', () => {
    render(
      <OrderList
        orderList={mockOrders.slice(0, 5)}
        ordersLoading={false}
      />,
    )

    // Should have 5 OrderItem components with data-testid="order"
    expect(screen.getAllByTestId('order')).toHaveLength(5)
  })

  it('shows load more button when there are more orders than page size', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={false}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Load more' }),
    ).toBeInTheDocument()
  })

  it('does not show load more button when all orders are visible', () => {
    const shortOrderList = mockOrders.slice(0, 5)
    render(
      <OrderList
        orderList={shortOrderList}
        ordersLoading={false}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()
  })

  it('renders first 10 orders initially', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={false}
      />,
    )

    // Initially 10 orders
    expect(screen.getAllByTestId('order')).toHaveLength(10)
  })

  it('loads more orders when load more button is clicked', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={false}
      />,
    )

    // Initially 10 orders
    expect(screen.getAllByTestId('order')).toHaveLength(10)

    // Click load more
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    // Now 12 orders (all orders shown)
    expect(screen.getAllByTestId('order')).toHaveLength(12)
  })

  it('hides load more button after loading all orders', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={false}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Load more' }),
    ).toBeInTheDocument()

    // Click load more to show all orders
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))

    // Load more button should be hidden
    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()
  })

  it('loads orders in chunks of 10', () => {
    const manyOrders = Array.from({ length: 25 }, (_, i) => ({
      order_id: `order${i + 1}`,
      ask_currency: { ticker: i % 2 === 0 ? 'ML' : `TKN${i + 1}` },
      give_currency: { ticker: i % 2 === 0 ? `TKN${i + 1}` : 'ML' },
      ask_balance: { decimal: `${(i + 1) * 10}.0` },
      give_balance: { decimal: `${(i + 1) * 5}.0` },
    }))

    render(
      <OrderList
        orderList={manyOrders}
        ordersLoading={false}
      />,
    )

    // Initially 10 orders
    expect(screen.getAllByTestId('order')).toHaveLength(10)

    // First load more - 20 orders
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getAllByTestId('order')).toHaveLength(20)

    // Second load more - 25 orders (all)
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }))
    expect(screen.getAllByTestId('order')).toHaveLength(25)
  })

  it('applies correct CSS classes', () => {
    render(
      <OrderList
        orderList={mockOrders}
        ordersLoading={false}
      />,
    )

    const orderList = screen.getByTestId('order-list')
    expect(orderList).toHaveClass('order-list')
  })

  it('updates visible orders when orderList prop changes', () => {
    const { rerender } = render(
      <OrderList
        orderList={[]}
        ordersLoading={false}
      />,
    )

    expect(screen.getByTestId('order-empty')).toBeInTheDocument()

    // Update with orders
    rerender(
      <OrderList
        orderList={mockOrders.slice(0, 3)}
        ordersLoading={false}
      />,
    )

    expect(screen.queryByTestId('order-empty')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('order')).toHaveLength(3)
  })

  it('handles exactly 10 orders without showing load more button', () => {
    const exactlyTenOrders = mockOrders.slice(0, 10)
    render(
      <OrderList
        orderList={exactlyTenOrders}
        ordersLoading={false}
      />,
    )

    expect(screen.getAllByTestId('order')).toHaveLength(10)
    expect(
      screen.queryByRole('button', { name: 'Load more' }),
    ).not.toBeInTheDocument()
  })

  it('renders empty list item with correct CSS class', () => {
    render(
      <OrderList
        orderList={[]}
        ordersLoading={false}
      />,
    )

    const emptyItem = screen.getByTestId('order-empty')
    expect(emptyItem).toHaveClass('empty-list')
  })
})

it('displays correct order data', () => {
  render(
    <OrderList
      orderList={[mockOrders[1]]}
      ordersLoading={false}
    />,
  )

  // Check that order data is displayed (these would be rendered by OrderItem)
  expect(screen.getByText('50.75')).toBeInTheDocument()
  expect(screen.getByText('TKN2')).toBeInTheDocument()
  expect(screen.getByText('25.125')).toBeInTheDocument()
  expect(screen.getByText('ML')).toBeInTheDocument()
})
