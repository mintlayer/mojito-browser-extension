import { render, screen } from '@testing-library/react'
import Balance from './Balance'
import { SettingsProvider, MintlayerContext } from '@Contexts'
import { BrowserRouter as Router } from 'react-router-dom'

const BALANCE_SAMPLE = 1
const EXCHANGE_RATE_SAMPLE = 25000

test('Render account balance with ML', () => {
  render(
    <Router>
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
    </SettingsProvider>,
    </Router>
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
    <Router>
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
    </SettingsProvider>,
    </Router>
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
    <Router>
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
    </SettingsProvider>,
    </Router>
  )

  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCE_SAMPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe('0.00 USD')
})
