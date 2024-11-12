import { render, screen } from '@testing-library/react'
import TransactionsList from './TransactionsList'
import { MintlayerContext } from '@Contexts'

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
    <MintlayerContext.Provider value={{ fetchingTransactions: true }}>
      <TransactionsList transactionsList={TRANSACTIONSSAMPLE} />
    </MintlayerContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const transactions = screen.getAllByTestId('transaction')

  expect(transactionsList).toBeInTheDocument()
  expect(transactions).toHaveLength(TRANSACTIONSSAMPLE.length)
})

test('Render transactions list component - empty', () => {
  render(
    <MintlayerContext.Provider value={{ fetchingTransactions: false }}>
      <TransactionsList transactionsList={[]} />
    </MintlayerContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const transactions = screen.getAllByTestId('transaction')

  expect(transactionsList).toBeInTheDocument()
  expect(transactions).toHaveLength(1)
})

test('Render transactions list component - loading', () => {
  render(
    <MintlayerContext.Provider value={{ fetchingTransactions: true }}>
      <TransactionsList transactionsList={[]} />
    </MintlayerContext.Provider>,
  )
  const transactionsList = screen.getByTestId('transactions-list')
  const skeletonLoading = screen.getAllByTestId('card')

  expect(transactionsList).toBeInTheDocument()
  expect(skeletonLoading).toHaveLength(6)
})
