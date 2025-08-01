import React from 'react'
import { render, screen } from '@testing-library/react'
import EmptyListMessage from './EmptyList'

describe('EmptyListMessage', () => {
  it('renders with provided message', () => {
    const testMessage = 'No items found'
    render(<EmptyListMessage message={testMessage} />)

    expect(screen.getByTestId('transaction')).toBeInTheDocument()
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders empty when no message provided', () => {
    render(<EmptyListMessage />)

    expect(screen.getByTestId('transaction')).toBeInTheDocument()
    expect(screen.getByTestId('transaction')).toBeEmptyDOMElement()
  })

  it('renders with empty string message', () => {
    render(<EmptyListMessage message="" />)

    expect(screen.getByTestId('transaction')).toBeInTheDocument()
    expect(screen.getByTestId('transaction')).toBeEmptyDOMElement()
  })

  it('applies correct CSS class', () => {
    render(<EmptyListMessage message="Test" />)

    const element = screen.getByTestId('transaction')
    expect(element).toHaveClass('emptyList')
  })

  it('renders with complex message content', () => {
    const complexMessage = 'No transactions available in this wallet'
    render(<EmptyListMessage message={complexMessage} />)

    expect(screen.getByText(complexMessage)).toBeInTheDocument()
  })
})
