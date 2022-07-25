import { render, screen, act, fireEvent } from '@testing-library/react'
import SendTransaction from './SendTransaction'

const TRANSACTIONDATASAMPLE = {
  fiatName: 'USD',
  tokenName: 'BTC',
  exchangeRate: 22343.23,
  maxValueInToken: 450,
}

test('Send Transaction', async () => {
  await act(async () => {
    await render(<SendTransaction transactionData={TRANSACTIONDATASAMPLE} />)
  })

  const btn = screen.getByText('Send')

  act(() => {
    fireEvent.click(btn)
  })
})
