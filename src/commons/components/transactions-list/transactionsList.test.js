import { render, screen } from '@testing-library/react'
import TransactionsList from './transactionsList'

const TRANSACTIONSSAMPLE = [
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
  },
]

test('Render transactions list component', () => {
  render(<TransactionsList transactionsList={TRANSACTIONSSAMPLE} />)
  const transactionsList = screen.getByTestId('transactions-list')
  const transactions = screen.getAllByTestId('transaction')

  expect(transactionsList).toBeInTheDocument()
  expect(transactions).toHaveLength(TRANSACTIONSSAMPLE.length)
})
