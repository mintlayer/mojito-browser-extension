import { render, screen } from '@testing-library/react'
import TransactionButton from './TransactionButton'

const TITLESAMPLE = 'transaction'

test('Render transaction button', () => {
  render(<TransactionButton />)
  const transactionButtonComponent = screen.getByTestId(
    'transaction-button-container',
  )
  const transactionButton = screen.getByTestId('button')
  expect(transactionButton).toBeInTheDocument()
  expect(transactionButtonComponent).toBeInTheDocument()

  expect(transactionButton).toHaveClass('button-transaction')
})

test('Render transaction button with UP prop', () => {
  render(<TransactionButton up />)
  const transactionButtonComponent = screen.getByTestId(
    'transaction-button-container',
  )
  const transactionButton = screen.getByTestId('button')

  expect(transactionButton).toBeInTheDocument()
  expect(transactionButtonComponent).toBeInTheDocument()
  expect(transactionButton).toHaveClass('button-transaction-up')
})

test('Render transaction button with title', () => {
  render(<TransactionButton title={TITLESAMPLE} />)
  const transactionButtonComponent = screen.getByTestId(
    'transaction-button-container',
  )
  const transactionButton = screen.getByTestId('button')
  const transactionButtonTitle = screen.getByTestId('transaction-button-title')

  expect(transactionButton).toBeInTheDocument()
  expect(transactionButtonComponent).toBeInTheDocument()
  expect(transactionButtonTitle).toBeInTheDocument()

  expect(transactionButtonTitle.textContent).toBe(TITLESAMPLE)
})
