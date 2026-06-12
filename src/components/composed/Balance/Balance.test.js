import { render, screen } from '@testing-library/react'
import Balance from './Balance'
import {
  SettingsProvider,
  MintlayerContext,
  ExchangeRatesContext,
} from '@Contexts'
import { BrowserRouter } from 'react-router'

const BALANCE_SAMPLE = 1
const EXCHANGE_RATE_SAMPLE = 25000

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

const renderBalance = ({ networkType, walletType } = {}) => {
  const settingsValue = networkType ? { networkType } : undefined
  return render(
    <BrowserRouter future={memoryRouterFeature}>
      <SettingsProvider value={settingsValue}>
        <ExchangeRatesContext.Provider value={{ thirtyDaysHistoryRates: {} }}>
          <MintlayerContext.Provider
            value={{ balanceLoading: false, tokenBalances: [] }}
          >
            <Balance
              balance={BALANCE_SAMPLE}
              exchangeRate={EXCHANGE_RATE_SAMPLE}
              walletType={walletType || { name: 'Mintlayer', ticker: 'ml' }}
            />
          </MintlayerContext.Provider>
        </ExchangeRatesContext.Provider>
      </SettingsProvider>
    </BrowserRouter>,
  )
}

test('Render account balance with ML', () => {
  renderBalance({ walletType: { name: 'Mintlayer', ticker: 'ml' } })

  const balanceCard = screen.getByTestId('current-balance')
  expect(balanceCard).toBeInTheDocument()
  expect(balanceCard).toHaveTextContent('ML')
  expect(balanceCard).toHaveTextContent(String(BALANCE_SAMPLE))
})

test('Render account balance with BTC', () => {
  renderBalance({ walletType: { name: 'Bitcoin', ticker: 'btc' } })

  const balanceCard = screen.getByTestId('current-balance')
  expect(balanceCard).toBeInTheDocument()
  expect(balanceCard).toHaveTextContent('BTC')
  expect(balanceCard).toHaveTextContent(String(BALANCE_SAMPLE))
})

test('renders balance with zero value when networkType is testnet', () => {
  renderBalance({
    networkType: 'testnet',
    walletType: { name: 'Bitcoin', ticker: 'btc' },
  })

  const balanceCard = screen.getByTestId('current-balance')
  expect(balanceCard).toBeInTheDocument()
  expect(balanceCard).toHaveTextContent('BTC')
  expect(balanceCard).toHaveTextContent(String(BALANCE_SAMPLE))
})
