import React from 'react'
import { OrderDetailsItem, SwapInfoContent } from './OrderDetails'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import OrderDetails from './OrderDetails'
import { MintlayerContext, SettingsContext, AccountContext } from '@Contexts'
import { ML } from '@Helpers'

describe('OrderDetailsItem', () => {
  it('renders with title and content', () => {
    const title = 'Test Title'
    const content = 'Test Content'

    render(
      <OrderDetailsItem
        title={title}
        content={content}
      />,
    )

    expect(screen.getByTestId('order-details-item')).toBeInTheDocument()
    expect(screen.getByTestId('order-details-item-title')).toHaveTextContent(
      title,
    )
    expect(screen.getByTestId('order-details-item-content')).toHaveTextContent(
      content,
    )
  })

  it('renders without title when title is not provided', () => {
    const content = 'Test Content'

    render(<OrderDetailsItem content={content} />)

    expect(screen.getByTestId('order-details-item')).toBeInTheDocument()
    expect(
      screen.queryByTestId('order-details-item-title'),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('order-details-item-content')).toHaveTextContent(
      content,
    )
  })

  it('renders without title when title is empty string', () => {
    const content = 'Test Content'

    render(
      <OrderDetailsItem
        title=""
        content={content}
      />,
    )

    expect(screen.getByTestId('order-details-item')).toBeInTheDocument()
    expect(
      screen.queryByTestId('order-details-item-title'),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('order-details-item-content')).toHaveTextContent(
      content,
    )
  })

  it('renders copy button when copyContent is provided', () => {
    const title = 'Test Title'
    const content = 'Test Content'
    const copyContent = 'Content to copy'

    render(
      <OrderDetailsItem
        title={title}
        content={content}
        copyContent={copyContent}
      />,
    )

    expect(screen.getByTestId('copy-btn')).toBeInTheDocument()
  })

  it('does not render copy button when copyContent is not provided', () => {
    const title = 'Test Title'
    const content = 'Test Content'

    render(
      <OrderDetailsItem
        title={title}
        content={content}
      />,
    )

    expect(screen.queryByTestId('copy-btn')).not.toBeInTheDocument()
  })

  it('renders with JSX content', () => {
    const title = 'Test Title'
    const content = <span data-testid="jsx-content">JSX Content</span>

    render(
      <OrderDetailsItem
        title={title}
        content={content}
      />,
    )

    expect(screen.getByTestId('jsx-content')).toBeInTheDocument()
    expect(screen.getByTestId('jsx-content')).toHaveTextContent('JSX Content')
  })
})

describe('SwapInfoContent', () => {
  const mockTokenOrder = {
    ask_currency: {
      type: 'Token',
      token_id: 'token123',
      ticker: 'TKN',
    },
    give_currency: {
      type: 'Coin',
      ticker: 'ML',
    },
    ask_balance: {
      decimal: '100.5',
    },
    give_balance: {
      decimal: '200.25',
    },
  }

  const mockCoinOrder = {
    ask_currency: {
      type: 'Coin',
      ticker: 'ML',
    },
    give_currency: {
      type: 'Token',
      token_id: 'token456',
      ticker: 'TKN2',
    },
    ask_balance: {
      decimal: '50.75',
    },
    give_balance: {
      decimal: '25.125',
    },
  }

  it('renders "from" token info correctly', () => {
    render(
      <SwapInfoContent
        order={mockTokenOrder}
        from
      />,
    )
    const component = screen.getByTestId('token-info-content')
    expect(component).toBeInTheDocument()

    const logo = screen.getByTestId('swap-token-logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveTextContent(mockTokenOrder.ask_currency.ticker[0])

    const tokenAmount = screen.getByTestId('token-amount')
    expect(tokenAmount).toBeInTheDocument()
    expect(tokenAmount).toHaveTextContent(
      mockTokenOrder.ask_balance.decimal +
        ' ' +
        mockTokenOrder.ask_currency.ticker,
    )

    const tokenId = screen.getByTestId('token-id')
    expect(tokenId).toBeInTheDocument()
    expect(tokenId).toHaveTextContent(mockTokenOrder.ask_currency.token_id)
  })

  it('renders "to" token info correctly', () => {
    render(<SwapInfoContent order={mockTokenOrder} />)

    const logo = screen.getByTestId('swap-token-logo')
    expect(logo).toBeInTheDocument()

    const tokenAmount = screen.getByTestId('token-amount')
    expect(tokenAmount).toBeInTheDocument()
    expect(tokenAmount).toHaveTextContent(
      mockTokenOrder.give_balance.decimal +
        ' ' +
        mockTokenOrder.give_currency.ticker,
    )

    const tokenId = screen.getByTestId('token-id')
    expect(tokenId).toBeInTheDocument()
    expect(tokenId).toHaveTextContent('(Mintlayer Coin)')
  })

  it('renders coin "from" info correctly', () => {
    render(
      <SwapInfoContent
        order={mockCoinOrder}
        from
      />,
    )

    const logo = screen.getByTestId('swap-token-logo')
    expect(logo).toBeInTheDocument()

    const tokenAmount = screen.getByTestId('token-amount')
    expect(tokenAmount).toBeInTheDocument()
    expect(tokenAmount).toHaveTextContent(
      mockCoinOrder.ask_balance.decimal +
        ' ' +
        mockCoinOrder.ask_currency.ticker,
    )

    const tokenId = screen.getByTestId('token-id')
    expect(tokenId).toBeInTheDocument()
    expect(tokenId).toHaveTextContent('(Mintlayer Coin)')
  })

  it('handles decimal amounts with different precision', () => {
    const orderWithVariousDecimals = {
      ask_currency: {
        type: 'Token',
        token_id: 'token789',
        ticker: 'TKN3',
      },
      give_currency: {
        type: 'Coin',
        ticker: 'ML',
      },
      ask_balance: {
        decimal: '0.000001',
      },
      give_balance: {
        decimal: '999999.999999',
      },
    }

    render(
      <SwapInfoContent
        order={orderWithVariousDecimals}
        from
      />,
    )
    expect(screen.getByText('0.000001 TKN3')).toBeInTheDocument()

    render(<SwapInfoContent order={orderWithVariousDecimals} />)
    expect(screen.getByText('999999.999999 ML')).toBeInTheDocument()
  })
})

// Start OrderDetails test
const mockTokenOrder = {
  order_id: 'order123456789',
  ask_currency: {
    type: 'Token',
    token_id: 'token123',
    ticker: 'TKN',
  },
  give_currency: {
    type: 'Coin',
    ticker: 'ML',
  },
  ask_balance: {
    decimal: '100.5',
  },
  give_balance: {
    decimal: '200.25',
  },
  quote_rate: 2.0,
}

const mockCoinOrder = {
  order_id: 'order987654321',
  ask_currency: {
    type: 'Coin',
    ticker: 'ML',
  },
  give_currency: {
    type: 'Token',
    token_id: 'token456',
    ticker: 'TKN2',
  },
  ask_balance: {
    decimal: '50.75',
  },
  give_balance: {
    decimal: '25.125',
  },
  quote_rate: 0.5,
}

const mockMintlayerContext = {
  client: {
    fillOrder: jest.fn(),
  },
  unusedAddresses: {
    receive: 'testnet_addr1',
  },
}

const mockSettingsContext = {
  networkType: 'testnet',
}

const mockAccountContext = {
  addresses: {
    mlAddresses: ['testnet_addr1', 'testnet_addr2'],
  },
}

const renderWithContext = (mockOrder) => {
  return render(
    <MintlayerContext.Provider value={mockMintlayerContext}>
      <SettingsContext.Provider value={mockSettingsContext}>
        <AccountContext.Provider value={mockAccountContext}>
          <OrderDetails order={mockOrder} />
        </AccountContext.Provider>
      </SettingsContext.Provider>
    </MintlayerContext.Provider>,
  )
}

describe('OrderDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders order details correctly', () => {
    renderWithContext(mockTokenOrder)

    expect(screen.getByTestId('order-details')).toBeInTheDocument()
    expect(screen.getByText('Order id:')).toBeInTheDocument()
    expect(
      screen.getByText(ML.formatAddress(mockTokenOrder.order_id, 36)),
    ).toBeInTheDocument()
    expect(screen.getByText('Exchage rate:')).toBeInTheDocument()
    expect(screen.getByText('1 TKN ≈ 2.0000000000 ML')).toBeInTheDocument()
  })

  it('renders coin order correctly', () => {
    renderWithContext(mockCoinOrder)

    expect(screen.getByText('1 ML ≈ 0.5000000000 TKN2')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ML amount')).toBeInTheDocument()
  })

  it('renders token order with correct placeholder', () => {
    renderWithContext(mockTokenOrder)

    expect(screen.getByPlaceholderText('TKN amount')).toBeInTheDocument()
  })

  it('validates amount input correctly', () => {
    renderWithContext(mockTokenOrder)

    const input = screen.getByRole('textbox')

    fireEvent.change(input, { target: { value: '50' } })
    expect(input).toHaveValue('50')

    fireEvent.change(input, { target: { value: '150' } })
    expect(input).toHaveValue('150')
  })

  it('calls fillOrder with correct parameters', async () => {
    renderWithContext(mockTokenOrder)

    const input = screen.getByRole('textbox')
    const swapButton = screen.getByRole('button', { name: /swap/i })

    fireEvent.change(input, { target: { value: '50' } })

    await waitFor(() => {
      expect(input).toHaveValue('50')
    })

    fireEvent.click(swapButton)

    await waitFor(() => {
      expect(mockMintlayerContext.client.fillOrder).toHaveBeenCalledWith({
        order_id: 'order123456789',
        amount: '50',
        destination: 'testnet_addr1',
      })
    })
  })

  it('shows error for invalid amount on swap click', async () => {
    renderWithContext(mockTokenOrder)

    const swapButton = screen.getByRole('button', { name: /swap/i })
    fireEvent.click(swapButton)

    await waitFor(() => {
      expect(screen.getByText('Amount is invalid')).toBeInTheDocument()
    })
  })
})
