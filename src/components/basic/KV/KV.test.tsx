import { render, screen } from '@testing-library/react'
import KV from './KV'

test('renders key/value rows', () => {
  render(
    <KV
      rows={[
        ['Ticker', 'BTC'],
        ['Network', 'Bitcoin'],
      ]}
    />,
  )
  expect(screen.getByText('Ticker')).toBeInTheDocument()
  expect(screen.getByText('BTC')).toBeInTheDocument()
  expect(screen.getByText('Network')).toBeInTheDocument()
})
