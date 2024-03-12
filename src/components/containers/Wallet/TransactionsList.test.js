import { render, screen } from '@testing-library/react'
import TransactionsList from './TransactionsList'
import { TransactionContext } from '@Contexts'

const TRANSACTIONSSAMPLE = [
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
    otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
    otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
    otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
  },
  {
    txid: 'txid',
    value: 1,
    direction: 'out',
    date: 1588888888,
    otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
  },
]

test('Render transactions list component', () => {
  render(
    <TransactionContext.Provider value={{ transactionsLoading: false }}>
      <TransactionsList transactionsList={TRANSACTIONSSAMPLE} />
    </TransactionContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const transactions = screen.getAllByTestId('transaction')

  expect(transactionsList).toBeInTheDocument()
  expect(transactions).toHaveLength(TRANSACTIONSSAMPLE.length)
})

test('Render transactions list component - empty', () => {
  render(
    <TransactionContext.Provider value={{ transactionsLoading: false }}>
      <TransactionsList transactionsList={[]} />
    </TransactionContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const transactions = screen.getAllByTestId('transaction')

  expect(transactionsList).toBeInTheDocument()
  expect(transactions).toHaveLength(1)
})

test('Render transactions list component - loading', () => {
  render(
    <TransactionContext.Provider value={{ transactionsLoading: true }}>
      <TransactionsList transactionsList={TRANSACTIONSSAMPLE} />
    </TransactionContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const skeletonLoading = screen.getAllByTestId('card')

  expect(transactionsList).toBeInTheDocument()
  expect(skeletonLoading).toHaveLength(3)
})
