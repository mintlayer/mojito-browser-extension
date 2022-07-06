import { render, screen, fireEvent } from '@testing-library/react'
import Transaction from './transaction'
import { format } from 'date-fns'
import { act } from 'react-dom/test-utils'

const TRANSCTIONSAMPLE = {
  txid: 'txid',
  value: 1,
  direction: 'in',
  date: 1588888888,
  otherPart: ['2MvTz52JfiHsDgbjRJLEY44hz8aebHGQZyb'],
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
}

const date = format(new Date(TRANSCTIONSAMPLE.date * 1000), 'dd/MM/yyyy HH:mm')

test('Render transaction component', async () => {
  render(<Transaction transaction={TRANSCTIONSAMPLE} />)
  const transaction = screen.getByTestId('transaction')
  const transactionOtherPart = screen.getByTestId('transaction-otherPart')
  const transactionDate = screen.getByTestId('transaction-date')
  const transactionAmout = screen.getByTestId('transaction-amout')
  const transactionIcon = screen.getByTestId('transaction-icon')

  await act(async () => expect(transaction).toBeInTheDocument())
  expect(transactionOtherPart.textContent.slice(0, 10)).toBe(
    TRANSCTIONSAMPLE.otherPart[0].slice(0, 10),
  )
  expect(transactionDate.textContent).toBe('Date: ' + date)
  expect(transactionAmout.textContent).toBe('Amout: ' + TRANSCTIONSAMPLE.value)

  expect(transactionIcon).not.toHaveClass('transaction-logo-out')

  await act(async () => fireEvent.click(transaction))
})

test('Render transaction out component', async () => {
  render(<Transaction transaction={TRANSCTIONSAMPLEOUT} />)
  const transaction = screen.getByTestId('transaction')
  const transactionOtherPart = screen.getByTestId('transaction-otherPart')
  const transactionDate = screen.getByTestId('transaction-date')
  const transactionAmout = screen.getByTestId('transaction-amout')
  const transactionIcon = screen.getByTestId('transaction-icon')

  await act(async () => expect(transaction).toBeInTheDocument())
  expect(transactionOtherPart.textContent.slice(0, 10)).toBe(
    TRANSCTIONSAMPLE.otherPart[0].slice(0, 10),
  )
  expect(transactionOtherPart.textContent).toContain('+1')
  expect(transactionDate.textContent).toBe('Date: ' + date)
  expect(transactionAmout.textContent).toBe('Amout: ' + TRANSCTIONSAMPLE.value)

  expect(transactionIcon).toHaveClass('transaction-logo-out')
})
