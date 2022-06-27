import { render, screen } from '@testing-library/react'
import Balance from './balance'

const BALANCESMAPLE = 1

test('Render account balance', () => {
  render(<Balance balance={BALANCESMAPLE} />)
  const currantBalanceComponent = screen.getByTestId('current-balance')
  const balanceParagraphs = screen.getAllByTestId('balance-paragraph')

  expect(balanceParagraphs).toHaveLength(2)
  expect(currantBalanceComponent).toBeInTheDocument()

  expect(balanceParagraphs[0].textContent).toBe(BALANCESMAPLE + ' BTC')
  expect(balanceParagraphs[1].textContent).toBe(BALANCESMAPLE * 25000 + ' USD')
})
