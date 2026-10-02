import { render, screen, act } from '@testing-library/react'
import Counter from './Counter'

test('renders the numeric value', () => {
  jest.useFakeTimers()
  render(
    <Counter
      value={1234.5}
      decimals={2}
    />,
  )
  act(() => {
    jest.advanceTimersByTime(2000)
  })
  expect(screen.getByTestId('counter').textContent).toContain('1,234.50')
  jest.useRealTimers()
})

test('supports prefix and suffix', () => {
  render(
    <Counter
      value={0}
      prefix="$"
      suffix=" USD"
    />,
  )
  expect(screen.getByTestId('counter').textContent).toContain('$')
})
