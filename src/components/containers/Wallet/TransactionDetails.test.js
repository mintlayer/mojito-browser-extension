import {
  render,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

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

test('Render transaction component', () => {
  const mockConfirmations = jest.fn().mockResolvedValue(1_234_567)

  renderTransactionDetails({
    transaction: TRANSCTIONSAMPLE,
    getConfirmations: mockConfirmations,
  })
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

  expect(transactionDetailsButton).toHaveTextContent('Open In Block Explorer')

  transactionDetailsButton.click()
})

test('Render transaction out component', async () => {
  const mockConfirmations = jest.fn().mockResolvedValue(1_500_000)

  renderTransactionDetails({
    transaction: TRANSCTIONSAMPLEOUT,
    getConfirmations: mockConfirmations,
  })

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

  expect(transactionDetails).toBeInTheDocument()
  expect(transactionDetailsItems).toHaveLength(5)

  expect(transactionDetailsTitles).toHaveLength(5)
  expect(transactionDetailsTitles[0]).toHaveTextContent('To:')

  await waitForElementToBeRemoved(() => screen.queryByTestId('loading'))
  expect(Number(transactionDetailsContent[4].textContent)).toBeGreaterThan(
    1_000_000,
  )
})
