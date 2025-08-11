import React from 'react'
import { render, screen } from '@testing-library/react'
import TransactionAmount from './TransactionAmount'
import { MintlayerContext } from '@Contexts'

const mockTokenMap = {
  token1: 'TKN1',
  token2: 'TKN2',
}

const renderWithContext = (ui, { tokenMap = mockTokenMap } = {}) => {
  return render(
    <MintlayerContext.Provider value={{ tokenMap }}>
      {ui}
    </MintlayerContext.Provider>,
  )
}

describe('TransactionAmount', () => {
  it('renders swap transaction with correct amounts and tokens', () => {
    const transaction = {
      type: 'FillOrder',
      value: {
        from: { amount: 10, token_id: 'token1' },
        to: { amount: 20, token_id: 'token2' },
      },
    }
    renderWithContext(<TransactionAmount transaction={transaction} />)
    expect(screen.getByTestId('transaction-amount')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-amount-from')).toHaveTextContent(
      '10 TKN1',
    )
    expect(screen.getByTestId('transaction-amount-to')).toHaveTextContent(
      '20 TKN2',
    )
    expect(screen.getByTestId('swap-icon')).toBeInTheDocument()
  })

  it('renders swap transaction with fallback ML ticker', () => {
    const transaction = {
      type: 'FillOrder',
      value: {
        from: { amount: 5, token_id: undefined },
        to: { amount: 15, token_id: undefined },
      },
    }
    renderWithContext(<TransactionAmount transaction={transaction} />)
    expect(screen.getByTestId('transaction-amount-from')).toHaveTextContent(
      '5 ML',
    )
    expect(screen.getByTestId('transaction-amount-to')).toHaveTextContent(
      '15 ML',
    )
  })

  it('renders non-swap transaction with formatted value', () => {
    const transaction = {
      type: 'Send',
      amount: 123456,
      value: 123456,
    }
    // Mock Format.BTCValue
    jest
      .spyOn(require('@Helpers').Format, 'BTCValue')
      .mockReturnValue('1.23456')
    renderWithContext(<TransactionAmount transaction={transaction} />)
    expect(screen.getByTestId('transaction-amount')).toHaveTextContent(
      '1.23456',
    )
  })
})
