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

describe('OrderItem', () => {
  it('renders order correctly', () => {
    render(<OrderItem order={mockOrder} />)

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
    render(<OrderItem order={mockTokenOrder} />)

    expect(screen.getByTestId('order')).toBeInTheDocument()
    expect(screen.getByText('50.75')).toBeInTheDocument()
    expect(screen.getByText('TKN2')).toBeInTheDocument()
    expect(screen.getByText('25.125')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('formats order ID correctly', () => {
    render(<OrderItem order={mockOrder} />)

    expect(screen.getByTestId('order-id')).toHaveTextContent(
      ML.formatAddress(mockOrder.order_id),
    )
  })

  it('applies correct CSS classes', () => {
    render(<OrderItem order={mockOrder} />)

    const orderItem = screen.getByTestId('order')
    expect(orderItem).toHaveClass('transaction')
  })

  it('renders swap icons', () => {
    render(<OrderItem order={mockOrder} />)

    const swapIcons = screen.getAllByTestId('swap-icon')
    expect(swapIcons).toHaveLength(2)
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

    render(<OrderItem order={orderWithLongDecimals} />)

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

    render(<OrderItem order={orderWithoutTicker} />)

    expect(screen.getByTestId('order')).toBeInTheDocument()
  })
})
