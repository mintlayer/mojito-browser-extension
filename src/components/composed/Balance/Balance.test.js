import { render, screen } from '@testing-library/react'
import Balance from './Balance'
import { SettingsProvider, MintlayerContext } from '@Contexts'
import { BrowserRouter } from 'react-router'

const BALANCE_SAMPLE = 1
const EXCHANGE_RATE_SAMPLE = 25000

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

test('Render account balance with ML', () => {
  render(
    <BrowserRouter future={memoryRouterFeature}>
      <SettingsProvider>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <Balance
            balance={BALANCE_SAMPLE}
            exchangeRate={EXCHANGE_RATE_SAMPLE}
            walletType={{ name: 'Mintlayer' }}
          />
        </MintlayerContext.Provider>
        ,
      </SettingsProvider>
      ,
    </BrowserRouter>,
  )
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCE_SAMPLE + ' ML')
  expect(balanceParagraphs[1].textContent).toBe(
    BALANCE_SAMPLE * EXCHANGE_RATE_SAMPLE + '.00 USD',
  )
})

test('Render account balance with BTC', () => {
  render(
    <BrowserRouter future={memoryRouterFeature}>
      <SettingsProvider>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <Balance
            balance={BALANCE_SAMPLE}
            exchangeRate={EXCHANGE_RATE_SAMPLE}
            walletType={{ name: 'Bitcoin' }}
          />
        </MintlayerContext.Provider>
        ,
      </SettingsProvider>
      ,
    </BrowserRouter>,
  )
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCE_SAMPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe(
    BALANCE_SAMPLE * EXCHANGE_RATE_SAMPLE + '.00 USD',
  )
})

test('renders balance with zero value when networkType is testnet', () => {
  render(
    <BrowserRouter future={memoryRouterFeature}>
      <SettingsProvider value={{ networkType: 'testnet' }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <Balance
            balance={BALANCE_SAMPLE}
            exchangeRate={EXCHANGE_RATE_SAMPLE}
            walletType={{ name: 'Bitcoin' }}
          />
        </MintlayerContext.Provider>
        ,
      </SettingsProvider>
      ,
    </BrowserRouter>,
  )

  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(1)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCE_SAMPLE + ' BTC')
})
