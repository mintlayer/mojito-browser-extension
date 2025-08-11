import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SwapPopupContent from './SwapPopupContent'

const mockTokens = [
  {
    token_id: 'token123456789abcdef',
    symbol: 'TKN1',
  },
  {
    token_id: 'token987654321fedcba',
    symbol: 'TKN2',
  },
  {
    token_id: 'custom123456789abcdef',
    symbol: 'CUSTOM',
  },
  {
    token_id: 'long123456789abcdefghijklmnop',
    symbol: 'LONG',
  },
]

const mockCoin = {
  type: 'Coin',
  symbol: 'ML',
}

describe('SwapPopupContent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders popup content correctly', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
        mode="from"
      />,
    )

    expect(screen.getByTestId('swap-popup-content')).toBeInTheDocument()
    expect(screen.getByTestId('swap-popup-title')).toHaveTextContent(
      'Swap from',
    )
    expect(
      screen.getByPlaceholderText('Search by symbol or token id'),
    ).toBeInTheDocument()
    expect(screen.getByTestId('swap-token-list')).toBeInTheDocument()
    expect(screen.getByText('ML Coins')).toBeInTheDocument()
  })

  it('renders all tokens in the list', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText(/TKN2 \(/)).toBeInTheDocument()
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
    expect(screen.getByText(/LONG \(/)).toBeInTheDocument()
  })

  it('calls handleTokenChange when coin is clicked', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    fireEvent.click(screen.getByText('ML Coins'))
    expect(mockHandleTokenChange).toHaveBeenCalledWith(mockCoin)
    expect(mockHandleTokenChange).toHaveBeenCalledTimes(1)
  })

  it('calls handleTokenChange when token is clicked', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    fireEvent.click(screen.getByText(/TKN1 \(/))
    expect(mockHandleTokenChange).toHaveBeenCalledWith(mockTokens[0])
    expect(mockHandleTokenChange).toHaveBeenCalledTimes(1)
  })

  it('filters tokens by symbol', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'TKN1' } })

    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.queryByText(/TKN2 \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/CUSTOM \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/LONG \(/)).not.toBeInTheDocument()
  })

  it('filters tokens by token_id', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'custom123' } })

    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
    expect(screen.queryByText(/TKN1 \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/TKN2 \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/LONG \(/)).not.toBeInTheDocument()
  })

  it('search is case-insensitive', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )

    // Test uppercase search
    fireEvent.change(searchInput, { target: { value: 'CUSTOM' } })
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()

    // Test lowercase search
    fireEvent.change(searchInput, { target: { value: 'custom' } })
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()

    // Test mixed case search
    fireEvent.change(searchInput, { target: { value: 'CuStOm' } })
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
  })

  it('shows no tokens when search has no matches', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } })

    expect(screen.queryByText(/TKN1 \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/TKN2 \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/CUSTOM \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/LONG \(/)).not.toBeInTheDocument()

    // ML Coins should still be visible
    expect(screen.getByText('ML Coins')).toBeInTheDocument()
  })

  it('clears search input', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )

    // Add search text
    fireEvent.change(searchInput, { target: { value: 'TKN1' } })
    expect(searchInput).toHaveValue('TKN1')

    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } })
    expect(searchInput).toHaveValue('')

    // All tokens should be visible again
    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText(/TKN2 \(/)).toBeInTheDocument()
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
    expect(screen.getByText(/LONG \(/)).toBeInTheDocument()
  })

  it('filters by partial matches', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'TKN' } })

    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText(/TKN2 \(/)).toBeInTheDocument()
    expect(screen.queryByText(/CUSTOM \(/)).not.toBeInTheDocument()
    expect(screen.queryByText(/LONG \(/)).not.toBeInTheDocument()
  })

  it('handles empty tokens array', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={[]}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    expect(screen.getByTestId('swap-popup-title')).toHaveTextContent('Swap to')
    expect(screen.getByText('ML Coins')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Search by symbol or token id'),
    ).toBeInTheDocument()

    // Only ML Coins should be visible (no other tokens rendered)
    expect(screen.queryByText(/TKN/)).not.toBeInTheDocument()
  })

  it('handles tokens without token_id', () => {
    const tokensWithoutId = [
      {
        symbol: 'NOSYMBOL',
      },
    ]
    const mockHandleTokenChange = jest.fn()

    render(
      <SwapPopupContent
        tokens={tokensWithoutId}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'NOSYMBOL' } })

    // Should find by symbol
    expect(screen.getByText(/NOSYMBOL \(/)).toBeInTheDocument()
  })

  it('renders with correct CSS classes', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    expect(screen.getByTestId('swap-popup-content')).toHaveClass(
      'token-popup-swap',
    )
    expect(
      screen.getByPlaceholderText('Search by symbol or token id'),
    ).toHaveClass('swap-token-search-input')
  })

  it('search input has correct attributes', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    expect(searchInput).toHaveAttribute('type', 'text')
    expect(searchInput).toHaveClass('swap-token-search-input')
  })

  it('renders list structure correctly', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const list = screen.getByTestId('swap-token-list')
    expect(list).toBeInTheDocument()
    expect(list.tagName).toBe('UL')
  })

  it('handles multiple clicks on same token', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const token = screen.getByText(/TKN1 \(/)
    fireEvent.click(token)
    fireEvent.click(token)
    fireEvent.click(token)

    expect(mockHandleTokenChange).toHaveBeenCalledTimes(3)
    expect(mockHandleTokenChange).toHaveBeenCalledWith(mockTokens[0])
  })

  it('updates search state correctly', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'test' } })
    expect(searchInput).toHaveValue('test')

    // Change search
    fireEvent.change(searchInput, { target: { value: 'another' } })
    expect(searchInput).toHaveValue('another')
  })

  it('shows all tokens when search is empty', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    // All tokens should be visible initially
    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText(/TKN2 \(/)).toBeInTheDocument()
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
    expect(screen.getByText(/LONG \(/)).toBeInTheDocument()
  })

  it('renders token with correct structure', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens.slice(0, 1)}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    // Check that token is rendered with formatted address
    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText('ML Coins')).toBeInTheDocument()
  })

  it('coin is always visible regardless of search', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'NONEXISTENT' } })

    // ML Coins should always be visible
    expect(screen.getByText('ML Coins')).toBeInTheDocument()
  })

  it('handles search with special characters', () => {
    const tokensWithSpecialChars = [
      {
        token_id: 'token-with-dashes',
        symbol: 'DASH-TOKEN',
      },
    ]
    const mockHandleTokenChange = jest.fn()

    render(
      <SwapPopupContent
        tokens={tokensWithSpecialChars}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: 'dash' } })

    expect(screen.getByText(/DASH-TOKEN \(/)).toBeInTheDocument()
  })

  it('handles search with numbers', () => {
    const mockHandleTokenChange = jest.fn()
    render(
      <SwapPopupContent
        tokens={mockTokens}
        coin={mockCoin}
        handleTokenChange={mockHandleTokenChange}
      />,
    )

    const searchInput = screen.getByPlaceholderText(
      'Search by symbol or token id',
    )
    fireEvent.change(searchInput, { target: { value: '123' } })

    // Should find tokens with '123' in their token_id
    expect(screen.getByText(/TKN1 \(/)).toBeInTheDocument()
    expect(screen.getByText(/CUSTOM \(/)).toBeInTheDocument()
    expect(screen.getByText(/LONG \(/)).toBeInTheDocument()
  })
})
