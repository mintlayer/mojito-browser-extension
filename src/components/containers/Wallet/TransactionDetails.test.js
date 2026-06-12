import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'

import TransactionDetails from './TransactionDetails'
import { TransactionDetailsItem } from './TransactionDetails'
import { SettingsContext, MintlayerContext } from '@Contexts'
import { LocalStorageService } from '@Storage'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('networkType', 'testnet')

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

const CONTENTSAMPLE = 'content'
const TITLESAMPLE = 'title'

const renderTransactionDetails = ({
  transaction,
  getConfirmations = jest.fn().mockResolvedValue(1_500_000),
  coinType = 'Bitcoin',
} = {}) => {
  return render(
    <MemoryRouter initialEntries={[`/${coinType}`]}>
      <Routes>
        <Route
          path="/:coinType"
          element={
            <SettingsContext.Provider value={{ networkType: 'testnet' }}>
              <MintlayerContext.Provider value={{ tokenMap: {} }}>
                <TransactionDetails
                  transaction={transaction}
                  getConfirmations={getConfirmations}
                />
              </MintlayerContext.Provider>
            </SettingsContext.Provider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

test('Render transaction detail item component', () => {
  render(
    <SettingsContext.Provider value={{ networkType: 'testnet' }}>
      <TransactionDetailsItem
        title={TITLESAMPLE}
        content={CONTENTSAMPLE}
      />
    </SettingsContext.Provider>,
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

test('Render transaction component', async () => {
  const mockConfirmations = jest.fn().mockResolvedValue(1_234_567)

  renderTransactionDetails({
    transaction: TRANSCTIONSAMPLE,
    getConfirmations: mockConfirmations,
  })
  const transactionDetails = screen.getByTestId('transaction-details')

  expect(transactionDetails).toBeInTheDocument()
  expect(screen.getByText('Receive')).toBeInTheDocument()
  expect(screen.getByText('From')).toBeInTheDocument()
  expect(screen.getByText(/View on Block Explorer/)).toBeInTheDocument()

  await waitFor(() => {
    expect(mockConfirmations).toHaveBeenCalled()
  })
})

test('Render transaction out component', async () => {
  const mockConfirmations = jest.fn().mockResolvedValue(1_500_000)

  renderTransactionDetails({
    transaction: TRANSCTIONSAMPLEOUT,
    getConfirmations: mockConfirmations,
  })

  const transactionDetails = screen.getByTestId('transaction-details')

  expect(transactionDetails).toBeInTheDocument()
  expect(screen.getByText('Send')).toBeInTheDocument()
  expect(screen.getByText('To')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText('1500000')).toBeInTheDocument()
  })
})
