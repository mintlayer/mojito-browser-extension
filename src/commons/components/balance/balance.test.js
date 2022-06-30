import { render, screen } from '@testing-library/react'
import Balance from './balance'

const BALANCESAMPLE = 1

test('Render account balance', () => {
  render(<Balance balance={BALANCESAMPLE} />)
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCESAMPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe(BALANCESAMPLE * 25000 + ' USD')
})
