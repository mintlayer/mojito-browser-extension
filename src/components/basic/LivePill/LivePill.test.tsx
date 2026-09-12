import { render, screen } from '@testing-library/react'
import LivePill from './LivePill'

test('renders positive values with an up marker', () => {
  render(<LivePill value={2.18} />)
  const pill = screen.getByTestId('live-pill')
  expect(pill).toHaveTextContent('▲')
  expect(pill).toHaveTextContent('2.18%')
})

test('renders negative values as absolute with a down marker', () => {
  render(<LivePill value={-2.1} />)
  const pill = screen.getByTestId('live-pill')
  expect(pill).toHaveTextContent('▼')
  expect(pill).toHaveTextContent('2.10%')
})

test('supports a custom suffix', () => {
  render(
    <LivePill
      value={1}
      suffix=" ML"
    />,
  )
  expect(screen.getByTestId('live-pill')).toHaveTextContent('1.00 ML')
})
