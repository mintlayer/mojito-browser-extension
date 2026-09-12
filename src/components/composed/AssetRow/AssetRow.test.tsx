import { render, screen } from '@testing-library/react'
import AssetRow from './AssetRow'

const asset = {
  id: 'Bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  chain: 'Bitcoin',
  amount: 0.0482,
  price: 96420.32,
  change24h: 2.18,
  spark: [1, 2, 3, 2, 4],
}

test('renders name with symbol (E2E contract)', () => {
  render(<AssetRow a={asset} />)
  expect(screen.getByText('Bitcoin (BTC)')).toBeInTheDocument()
})

test('renders fiat value and change pill', () => {
  const { container } = render(<AssetRow a={asset} />)
  const fiat = container.querySelector('.fiat')
  expect(fiat?.textContent).toContain('4,647.46')
  expect(screen.getByTestId('live-pill')).toHaveTextContent('2.18%')
})

test('marks mock assets with a Demo tag', () => {
  render(
    <AssetRow a={{ ...asset, id: 'tmltk1q', symbol: 'CBEAT', mock: true }} />,
  )
  expect(screen.getByText('Demo')).toBeInTheDocument()
})
