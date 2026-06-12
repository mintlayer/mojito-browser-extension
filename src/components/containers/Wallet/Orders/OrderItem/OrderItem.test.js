import React from 'react'
import { render, screen } from '@testing-library/react'
import OrderItem from './OrderItem'
import { ML } from '@Helpers'

const mockOrder = {
  order_id: 'order123456789',
  ask_currency: {
    ticker: 'ML',
  },
  give_currency: {
    ticker: 'TKN',
  },
  ask_balance: {
    decimal: '100.5',
  },
  give_balance: {
    decimal: '200.25',
  },
}

const mockTokenOrder = {
  order_id: 'order987654321',
  ask_currency: {
    ticker: 'TKN2',
  },
  give_currency: {
    ticker: 'ML',
  },
  ask_balance: {
    decimal: '50.75',
  },
  give_balance: {
    decimal: '25.125',
  },
}

const renderOrderItem = (order) => {
  return render(
    <table>
      <tbody>
        <OrderItem order={order} />
      </tbody>
    </table>,
  )
}

describe('OrderItem', () => {
  it('renders order correctly', () => {
    renderOrderItem(mockOrder)

    expect(screen.getByTestId('order')).toBeInTheDocument()
    expect(screen.getByTestId('order-id')).toHaveTextContent(
      ML.formatAddress(mockOrder.order_id),
    )
    expect(screen.getByText('100.5')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
    expect(screen.getByText('200.25')).toBeInTheDocument()
    expect(screen.getByText('TKN')).toBeInTheDocument()
  })

  it('renders token order correctly', () => {
    renderOrderItem(mockTokenOrder)

    expect(screen.getByTestId('order')).toBeInTheDocument()
    expect(screen.getByText('50.75')).toBeInTheDocument()
    expect(screen.getByText('TKN2')).toBeInTheDocument()
    expect(screen.getByText('25.125')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('formats order ID correctly', () => {
    renderOrderItem(mockOrder)

    expect(screen.getByTestId('order-id')).toHaveTextContent(
      ML.formatAddress(mockOrder.order_id),
    )
  })

  it('applies correct CSS classes', () => {
    renderOrderItem(mockOrder)

    const orderItem = screen.getByTestId('order')
    expect(orderItem).toHaveClass('row')
  })

  it('renders chevron indicator', () => {
    renderOrderItem(mockOrder)

    expect(screen.getByText('›')).toBeInTheDocument()
  })

  it('handles long decimal values', () => {
    const orderWithLongDecimals = {
      ...mockOrder,
      ask_balance: {
        decimal: '123.456789',
      },
      give_balance: {
        decimal: '987.123456',
      },
    }

    renderOrderItem(orderWithLongDecimals)

    expect(screen.getByText('123.456789')).toBeInTheDocument()
    expect(screen.getByText('987.123456')).toBeInTheDocument()
  })

  it('handles missing ticker gracefully', () => {
    const orderWithoutTicker = {
      ...mockOrder,
      ask_currency: {
        ticker: undefined,
      },
      give_currency: {
        ticker: undefined,
      },
    }

    renderOrderItem(orderWithoutTicker)

    expect(screen.getByTestId('order')).toBeInTheDocument()
  })

  it('shows exchange rate when quote_rate is available', () => {
    const orderWithRate = {
      ...mockOrder,
      quote_rate: 2.0,
    }

    renderOrderItem(orderWithRate)

    expect(screen.getByText('1 ML = 2 TKN')).toBeInTheDocument()
  })

  it('does not show exchange rate when quote_rate is missing', () => {
    renderOrderItem(mockOrder)

    expect(screen.queryByText(/1 ML =/)).not.toBeInTheDocument()
  })
})
