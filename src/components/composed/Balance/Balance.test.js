import { render, screen } from '@testing-library/react'
import Balance from './Balance'
import { AccountProvider } from '@Contexts'

const BALANCESAMPLE = 1
const exchangeRate = 25000

test('Render account balance with ML', () => {
  render(
    <AccountProvider value={{ walletType: { name: 'Mintlayer' } }}>
      <Balance
        balance={BALANCESAMPLE}
        exchangeRate={exchangeRate}
      />
      ,
    </AccountProvider>,
  )
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCESAMPLE + ' ML')
  expect(balanceParagraphs[1].textContent).toBe(
    BALANCESAMPLE * exchangeRate + ',00 USD',
  )
})

test('Render account balance with BTC', () => {
  render(
    <AccountProvider value={{ walletType: { name: 'Bitcoin' } }}>
      <Balance
        balance={BALANCESAMPLE}
        exchangeRate={exchangeRate}
      />
      ,
    </AccountProvider>,
  )
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCESAMPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe(
    BALANCESAMPLE * exchangeRate + ',00 USD',
  )
})
