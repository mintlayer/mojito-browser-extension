import { render, screen } from '@testing-library/react'
import Balance from './Balance'

const BALANCESAMPLE = 1
const exchangeRate = 25000
test('Render account balance', () => {
  render(
    <Balance
      balance={BALANCESAMPLE}
      exchangeRate={exchangeRate}
    />,
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
