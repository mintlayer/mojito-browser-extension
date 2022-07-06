import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import TransactionDetails from './transactionDetails'
import { TransactionDetailsItem } from './transactionDetails'
// import { format } from 'date-fns'

const TRANSCTIONSAMPLE = {
  txid: 'txid',
  value: 1,
  direction: 'in',
  date: 1588888888,
  otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
  blockHeight: 10_000,
}

const TRANSCTIONSAMPLEOUT = {
  txid: 'txid',
  value: 1,
  direction: 'out',
  date: 1588888888,
  otherPart: [
    '2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb',
    '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom',
  ],
  blockHeight: 10_000,
}
// const date = format(new Date(TRANSCTIONSAMPLE.date * 1000), 'dd/MM/yyyy')

const CONTENTSAMPLE = 'content'
const TITLESAMPLE = 'title'

test('Render transaction detail item component', () => {
  render(
    <TransactionDetailsItem
      title={TITLESAMPLE}
      content={CONTENTSAMPLE}
    />,
  )
  const transactionDetailsItem = screen.getByTestId('transaction-details-item')
  const transactionDetailsItemTitle = screen.getByTestId(
    'transaction-details-item-title',
  )
  const transactionDetailsItemContent = screen.getByTestId(
    'transaction-details-item-content',
  )

  expect(transactionDetailsItem).toBeInTheDocument()

  expect(transactionDetailsItemTitle).toHaveTextContent(TITLESAMPLE)
  expect(transactionDetailsItemContent).toHaveTextContent(CONTENTSAMPLE)
})

test('Render transaction component', () => {
  render(<TransactionDetails transaction={TRANSCTIONSAMPLE} />)
  const transactionDetails = screen.getByTestId('transaction-details')
  const transactionDetailsItems = screen.getAllByTestId(
    'transaction-details-item',
  )
  const transactionDetailsTitles = screen.getAllByTestId(
    'transaction-details-item-title',
  )
  const transactionDetailsButton = screen.getByTestId('button')

  expect(transactionDetails).toBeInTheDocument()
  expect(transactionDetailsButton).toBeInTheDocument()
  expect(transactionDetailsItems).toHaveLength(5)

  expect(transactionDetailsTitles).toHaveLength(5)
  expect(transactionDetailsTitles[0]).toHaveTextContent('From:')

  expect(transactionDetailsButton).toHaveTextContent('Open In Blockchain')

  transactionDetailsButton.click()
})

test('Render transaction out component', async () => {
  render(<TransactionDetails transaction={TRANSCTIONSAMPLEOUT} />)

  const transactionDetails = screen.getByTestId('transaction-details')
  const transactionDetailsItems = screen.getAllByTestId(
    'transaction-details-item',
  )
  const transactionDetailsTitles = screen.getAllByTestId(
    'transaction-details-item-title',
  )
  const transactionDetailsContent = screen.getAllByTestId(
    'transaction-details-item-content',
  )
  const confirmationsLoading = screen.getByTestId('loading')

  await act(async () => expect(transactionDetails).toBeInTheDocument())
  expect(transactionDetailsItems).toHaveLength(5)

  expect(transactionDetailsTitles).toHaveLength(5)
  expect(transactionDetailsTitles[0]).toHaveTextContent('To:')

  // console.log(confirmationsLoading)
  await waitForElementToBeRemoved(confirmationsLoading)
  expect(Number(transactionDetailsContent[4].textContent)).toBeGreaterThan(
    1_000_000,
  )
})
