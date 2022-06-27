import { render, screen } from '@testing-library/react'
import Transaction from './transaction'
import { format } from 'date-fns'

const TRANSCTIONSAMPLE = {
  txid: 'txid',
  value: 1,
  direction: 'in',
  date: 1588888888,
}

const TRANSCTIONSAMPLEOUT = {
  txid: 'txid',
  value: 1,
  direction: 'out',
  date: 1588888888,
}

const date = format(new Date(TRANSCTIONSAMPLE.date * 1000), 'yyyy-MM-dd')

test('Render transaction component', () => {
  render(<Transaction transaction={TRANSCTIONSAMPLE} />)
  const transaction = screen.getByTestId('transaction')
  const transactionTXID = screen.getByTestId('transaction-txid')
  const transactionDate = screen.getByTestId('transaction-date')
  const transactionAmout = screen.getByTestId('transaction-amout')
  const transactionIcon = screen.getByTestId('transaction-icon')

  expect(transactionTXID.textContent).toBe(TRANSCTIONSAMPLE.txid)
  expect(transactionDate.textContent).toBe('Date: ' + date)
  expect(transactionAmout.textContent).toBe('Amout: ' + TRANSCTIONSAMPLE.value)

  expect(transactionIcon).not.toHaveClass('transaction-logo-out')

  expect(transaction).toBeInTheDocument()
})

test('Render transaction out component', () => {
  render(<Transaction transaction={TRANSCTIONSAMPLEOUT} />)
  const transaction = screen.getByTestId('transaction')
  const transactionTXID = screen.getByTestId('transaction-txid')
  const transactionDate = screen.getByTestId('transaction-date')
  const transactionAmout = screen.getByTestId('transaction-amout')
  const transactionIcon = screen.getByTestId('transaction-icon')

  expect(transactionTXID.textContent).toBe(TRANSCTIONSAMPLE.txid)
  expect(transactionDate.textContent).toBe('Date: ' + date)
  expect(transactionAmout.textContent).toBe('Amout: ' + TRANSCTIONSAMPLE.value)

  expect(transactionIcon).toHaveClass('transaction-logo-out')

  expect(transaction).toBeInTheDocument()
})
