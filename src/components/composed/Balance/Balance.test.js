import { render, screen } from '@testing-library/react'
import Balance from './Balance'
import { AccountProvider, SettingsProvider } from '@Contexts'

const BALANCE_SAMPLE = 1
const EXCHANGE_RATE_SAMPLE = 25000

test('Render account balance with ML', () => {
  render(
    <AccountProvider value={{ walletType: { name: 'Mintlayer' } }}>
      <SettingsProvider>
        <Balance
          balance={BALANCE_SAMPLE}
          exchangeRate={EXCHANGE_RATE_SAMPLE}
        />
        ,
      </SettingsProvider>
    </AccountProvider>,
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
    <AccountProvider value={{ walletType: { name: 'Bitcoin' } }}>
      <SettingsProvider>
        <Balance
          balance={BALANCE_SAMPLE}
          exchangeRate={EXCHANGE_RATE_SAMPLE}
        />
        ,
      </SettingsProvider>
    </AccountProvider>,
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
    <AccountProvider value={{ walletType: { name: 'Bitcoin' } }}>
      <SettingsProvider value={{ networkType: 'testnet' }}>
        <Balance
          balance={BALANCE_SAMPLE}
          exchangeRate={EXCHANGE_RATE_SAMPLE}
        />
        ,
      </SettingsProvider>
    </AccountProvider>,
  )

  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCE_SAMPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe('0.00 USD')
})
