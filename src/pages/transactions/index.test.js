import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import TransactionsPage from './index'

test('Renders transactions page', () => {
  render(<TransactionsPage />, { wrapper: MemoryRouter })
  const transactionsPage = screen.getByTestId('transactions-page')
  expect(transactionsPage).toBeInTheDocument()
})
