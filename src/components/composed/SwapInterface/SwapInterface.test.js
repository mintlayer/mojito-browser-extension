import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SwapInterface from './SwapInterface'
import { MintlayerContext, SettingsContext } from '@Contexts'

// Mock child components
jest.mock('./SwapPopupContent', () => {
  return function SwapPopupContent({ coin, tokens, handleTokenChange }) {
    return (
      <div data-testid="swap-popup-content">
        <button onClick={() => handleTokenChange(coin)}>Select Coin</button>
        {tokens.map((token, index) => (
          <button
            key={index}
            onClick={() => handleTokenChange(token)}
          >
            Select {token.symbol || token.token_ticker?.string}
          </button>
        ))}
      </div>
    )
  }
})

jest.mock('./SelectTokenSwap', () => {
  return function SelectTokenSwap({ token, onClick }) {
    return (
      <button
        data-testid="select-token-swap"
        onClick={onClick}
      >
        {token.symbol || token.token_ticker?.string || token.type}
      </button>
    )
  }
})

// Mock icons
jest.mock('@Assets/images/icon-arrow-down.svg', () => ({
  ReactComponent: (props) => (
    <svg
      data-testid="arrow-icon"
      {...props}
    />
  ),
}))

jest.mock('@Assets/images/icon-search.svg', () => ({
  ReactComponent: (props) => (
    <svg
      data-testid="search-icon"
      {...props}
    />
  ),
}))

const mockTokenBalances = {
  token1: {
    balance: '100.5',
    token_info: {
      number_of_decimals: 8,
      token_ticker: { string: 'TKN1' },
      token_id: 'token123',
    },
  },
  token2: {
    balance: '50.25',
    token_info: {
      number_of_decimals: 6,
      token_ticker: { string: 'TKN2' },
      token_id: 'token456',
    },
  },
}

const mockAllNetworkTokensData = [
  {
    type: 'Token',
    symbol: 'NET1',
    token_id: 'network_token_1',
  },
  {
    type: 'Token',
    symbol: 'NET2',
    token_id: 'network_token_2',
  },
]

const mockMintlayerContext = {
  tokenBalances: mockTokenBalances,
  balance: '1000.0',
  allNetworkTokensData: mockAllNetworkTokensData,
  fetchOrdersPairInfo: jest.fn(),
}

const mockSettingsContext = {
  networkType: 'testnet',
}

const renderWithContext = (
  mintlayerContext = mockMintlayerContext,
  settingsContext = mockSettingsContext,
) => {
  return render(
    <MintlayerContext.Provider value={mintlayerContext}>
      <SettingsContext.Provider value={settingsContext}>
        <SwapInterface />
      </SettingsContext.Provider>
    </MintlayerContext.Provider>,
  )
}

describe('SwapInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders swap interface correctly', () => {
    renderWithContext()

    expect(screen.getByText('Swap From')).toBeInTheDocument()
    expect(screen.getByText('Swap To')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /find orders/i }),
    ).toBeInTheDocument()
  })

  it('initializes with coin as from token and first network token as to token', () => {
    renderWithContext()

    const selectTokenButtons = screen.getAllByTestId('select-token-swap')
    expect(selectTokenButtons[0]).toHaveTextContent('Coin')
    expect(selectTokenButtons[1]).toHaveTextContent('NET1')
  })

  it('displays correct balance for from token', () => {
    renderWithContext()

    expect(screen.getByText(/Balance: 1000.0/)).toBeInTheDocument()
  })

  it('handles amount input correctly', () => {
    renderWithContext()

    const amountInput = screen.getByPlaceholderText('0')

    fireEvent.change(amountInput, { target: { value: '123.45' } })
    expect(amountInput).toHaveValue(123.45)
  })

  it('rejects invalid amount input', () => {
    renderWithContext()

    const amountInput = screen.getByPlaceholderText('0')

    // Try to enter invalid characters
    fireEvent.change(amountInput, { target: { value: 'abc' } })
    expect(amountInput).toHaveValue(null)

    fireEvent.change(amountInput, { target: { value: '12.34.56' } })
    expect(amountInput).toHaveValue(null)
  })

  it('opens from token popup when from token is clicked', () => {
    renderWithContext()

    const fromTokenButton = screen.getAllByTestId('select-token-swap')[0]
    fireEvent.click(fromTokenButton)

    expect(screen.getByTestId('swap-popup-content')).toBeInTheDocument()
    expect(screen.getByText('Select Coin')).toBeInTheDocument()
    expect(screen.getByText('Select TKN1')).toBeInTheDocument()
    expect(screen.getByText('Select TKN2')).toBeInTheDocument()
  })

  it('opens to token popup when to token is clicked', () => {
    renderWithContext()

    const toTokenButton = screen.getAllByTestId('select-token-swap')[1]
    fireEvent.click(toTokenButton)

    expect(screen.getByTestId('swap-popup-content')).toBeInTheDocument()
    expect(screen.getByText('Select NET1')).toBeInTheDocument()
    expect(screen.getByText('Select NET2')).toBeInTheDocument()
  })

  it('changes from token when selected from popup', () => {
    renderWithContext()

    // Open from token popup
    const fromTokenButton = screen.getAllByTestId('select-token-swap')[0]
    fireEvent.click(fromTokenButton)

    // Select a wallet token
    fireEvent.click(screen.getByText('Select TKN1'))

    // Popup should close and token should change
    expect(screen.queryByTestId('swap-popup-content')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('select-token-swap')[0]).toHaveTextContent(
      'TKN1',
    )
  })

  it('changes to token when selected from popup', () => {
    renderWithContext()

    // Open to token popup
    const toTokenButton = screen.getAllByTestId('select-token-swap')[1]
    fireEvent.click(toTokenButton)

    // Select a network token
    fireEvent.click(screen.getByText('Select NET2'))

    // Popup should close and token should change
    expect(screen.queryByTestId('swap-popup-content')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('select-token-swap')[1]).toHaveTextContent(
      'NET2',
    )
  })

  it('disables find orders button when no amount', () => {
    renderWithContext()

    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })
    expect(findOrdersButton).toBeDisabled()
  })

  it('enables find orders button when amount is entered', () => {
    renderWithContext()

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '100' } })
    expect(findOrdersButton).toBeEnabled()
  })

  it('calls fetchOrdersPairInfo with correct parameters for coin to token swap', async () => {
    renderWithContext()

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.click(findOrdersButton)

    await waitFor(() => {
      expect(mockMintlayerContext.fetchOrdersPairInfo).toHaveBeenCalledWith(
        'TML_network_token_1',
        '100',
      )
    })
  })

  it('calls fetchOrdersPairInfo with correct parameters for token to coin swap', async () => {
    renderWithContext()

    // Change from token to a wallet token
    const fromTokenButton = screen.getAllByTestId('select-token-swap')[0]
    fireEvent.click(fromTokenButton)
    fireEvent.click(screen.getByText('Select TKN1'))

    // Change to token to coin
    const toTokenButton = screen.getAllByTestId('select-token-swap')[1]
    fireEvent.click(toTokenButton)
    fireEvent.click(screen.getByText('Select Coin'))

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '50' } })
    fireEvent.click(findOrdersButton)

    await waitFor(() => {
      expect(mockMintlayerContext.fetchOrdersPairInfo).toHaveBeenCalledWith(
        'token123_TML',
        '50',
      )
    })
  })

  it('calls fetchOrdersPairInfo with correct parameters for token to token swap', async () => {
    renderWithContext()

    // Change from token to a wallet token
    const fromTokenButton = screen.getAllByTestId('select-token-swap')[0]
    fireEvent.click(fromTokenButton)
    fireEvent.click(screen.getByText('Select TKN1'))

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '25' } })
    fireEvent.click(findOrdersButton)

    await waitFor(() => {
      expect(mockMintlayerContext.fetchOrdersPairInfo).toHaveBeenCalledWith(
        'token123_network_token_1',
        '25',
      )
    })
  })

  it('handles mainnet network type correctly', () => {
    const mainnetContext = { ...mockSettingsContext, networkType: 'mainnet' }
    renderWithContext(mockMintlayerContext, mainnetContext)

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.click(findOrdersButton)

    expect(mockMintlayerContext.fetchOrdersPairInfo).toHaveBeenCalledWith(
      'ML_network_token_1',
      '100',
    )
  })

  it('prevents coin to coin swap', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    renderWithContext()

    // Change to token to coin
    const toTokenButton = screen.getAllByTestId('select-token-swap')[1]
    fireEvent.click(toTokenButton)
    fireEvent.click(screen.getByText('Select Coin'))

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.click(findOrdersButton)

    expect(consoleSpy).toHaveBeenCalledWith(
      'Cannot swap between coins directly',
    )
    consoleSpy.mockRestore()
  })

  it('handles fetchOrdersPairInfo errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    const errorContext = {
      ...mockMintlayerContext,
      fetchOrdersPairInfo: jest
        .fn()
        .mockRejectedValue(new Error('Network error')),
    }

    renderWithContext(errorContext)

    const amountInput = screen.getByPlaceholderText('0')
    const findOrdersButton = screen.getByRole('button', {
      name: /find orders/i,
    })

    fireEvent.change(amountInput, { target: { value: '100' } })
    fireEvent.click(findOrdersButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching orders:',
        expect.any(Error),
      )
    })

    consoleSpy.mockRestore()
  })

  it('renders swap arrow button', () => {
    renderWithContext()

    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
  })

  it('renders search icon in find orders button', () => {
    renderWithContext()

    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('updates balance display when from token changes', () => {
    renderWithContext()

    // Initially shows coin balance
    expect(screen.getByText(/Balance: 1000.0/)).toBeInTheDocument()

    // Change to wallet token
    const fromTokenButton = screen.getAllByTestId('select-token-swap')[0]
    fireEvent.click(fromTokenButton)
    fireEvent.click(screen.getByText('Select TKN1'))

    // Should show token balance
    expect(screen.getByText(/Balance: 100.5/)).toBeInTheDocument()
  })
})
