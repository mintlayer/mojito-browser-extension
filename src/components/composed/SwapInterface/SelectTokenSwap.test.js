import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SelectTokenSwap from './SelectTokenSwap'
import { ML } from '@Helpers'

const mockTokenData = {
  type: 'Token',
  token_id: 'token123456789abcdef',
  symbol: 'TKN',
}

const mockCoinData = {
  type: 'Coin',
  symbol: 'ML',
}

describe('SelectTokenSwap', () => {
  it('renders token selection correctly', () => {
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={mockTokenData}
        onClick={mockOnClick}
      />,
    )
    const element = screen.getByTestId('select-token-swap')
    expect(element).toBeInTheDocument()
    const logo = screen.getByTestId('swap-token-logo')
    expect(logo).toBeInTheDocument()
    const content = screen.getByTestId('select-token-swap-content')
    expect(content).toBeInTheDocument()
    expect(content).toHaveTextContent(mockTokenData.symbol)
    expect(content).toHaveTextContent(
      `(${ML.formatAddress(mockTokenData.token_id, 16)})`,
    )
  })

  it('renders coin (ML) selection correctly', () => {
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={mockCoinData}
        onClick={mockOnClick}
      />,
    )

    expect(screen.getByText('ML (Mintlayer)')).toBeInTheDocument()
  })

  it('calls onClick when swap token select is clicked', () => {
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={mockTokenData}
        onClick={mockOnClick}
      />,
    )

    const content = screen.getByTestId('select-token-swap-content')
    fireEvent.click(content)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('renders with correct CSS classes', () => {
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={mockTokenData}
        onClick={mockOnClick}
      />,
    )
    expect(screen.getByTestId('select-token-swap')).toHaveClass(
      'swap-select-wrapper',
    )
    expect(screen.getByTestId('select-token-swap-content')).toHaveClass(
      'swap-token-select',
    )
  })

  it('handles different token symbols', () => {
    const customToken = {
      type: 'Token',
      token_id: 'custom123456789abcdef',
      symbol: 'CUSTOM',
    }
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={customToken}
        onClick={mockOnClick}
      />,
    )

    expect(
      screen.getByText(
        `${customToken.symbol} (${ML.formatAddress(customToken.token_id, 16)})`,
      ),
    ).toBeInTheDocument()
  })

  it('handles token without token_id', () => {
    const tokenWithoutId = {
      type: 'Token',
      symbol: 'TKN2',
    }
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={tokenWithoutId}
        onClick={mockOnClick}
      />,
    )

    expect(
      screen.getByText(`${tokenWithoutId.symbol} (Wrong address)`),
    ).toBeInTheDocument()
  })

  it('renders chevron down icon', () => {
    const mockOnClick = jest.fn()
    render(
      <SelectTokenSwap
        token={mockTokenData}
        onClick={mockOnClick}
      />,
    )

    const icon = screen.getByTestId('chevron-down-icon')
    expect(icon).toBeInTheDocument()
  })

  it('differentiates between coin and token display', () => {
    const mockOnClick = jest.fn()

    // Render token
    const { rerender } = render(
      <SelectTokenSwap
        token={mockTokenData}
        onClick={mockOnClick}
      />,
    )
    expect(
      screen.getByText(
        `${mockTokenData.symbol} (${ML.formatAddress(mockTokenData.token_id, 16)})`,
      ),
    ).toBeInTheDocument()

    // Render coin
    rerender(
      <SelectTokenSwap
        token={mockCoinData}
        onClick={mockOnClick}
      />,
    )
    expect(screen.getByText('ML (Mintlayer)')).toBeInTheDocument()
  })
})
