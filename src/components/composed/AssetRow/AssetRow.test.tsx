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

test('marks authority rows and disabled rows with their tags and styles', () => {
  const { container } = render(
    <AssetRow
      a={{
        ...asset,
        authority: true,
        disabled: true,
        change24h: -1.5,
      }}
    />,
  )
  expect(screen.getByText('Issuer')).toBeInTheDocument()
  expect(screen.getByText('Sync issue')).toBeInTheDocument()
  expect(container.firstChild.className).toContain('disabled')
})

test('Mintlayer coin (type "coin") has no Token tag', () => {
  render(
    <AssetRow
      a={{
        id: 'Mintlayer',
        name: 'Mintlayer',
        symbol: 'ML',
        chain: 'Mintlayer',
        type: 'coin',
        amount: 12.5,
      }}
    />,
  )
  expect(screen.queryByText('Token')).not.toBeInTheDocument()
})

test('attacker token tickeried "ML" keeps its Token tag and no native logo (spoof regression)', () => {
  // The Token tag and native branding key off the wallet-owned `type`,
  // never off the issuer-chosen name/symbol.
  const { container } = render(
    <AssetRow
      a={{
        id: 'tmltk1qabc',
        name: 'ML',
        symbol: 'ML',
        chain: 'Mintlayer',
        type: 'token',
        amount: 5,
      }}
    />,
  )
  expect(screen.getByText('Token')).toBeInTheDocument()
  // No official Mintlayer logo may leak into the attacker's row.
  expect(container.querySelector('svg')).not.toBeInTheDocument()
})

test('legacy asset shape with no type renders untagged (fail-safe)', () => {
  render(
    <AssetRow
      a={{
        id: 'Mintlayer',
        name: 'Mintlayer',
        symbol: 'ML',
        chain: 'Mintlayer',
        amount: 12.5,
      }}
    />,
  )
  expect(screen.queryByText('Token')).not.toBeInTheDocument()
})

test('real Mintlayer token (type "token") gets a Token tag', () => {
  render(
    <AssetRow
      a={{
        id: 'tmltk1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv4scgu',
        name: 'CBEAT',
        symbol: 'CBEAT',
        chain: 'Mintlayer',
        type: 'token',
        amount: 5,
      }}
    />,
  )
  expect(screen.getByText('Token')).toBeInTheDocument()
})

test('Bitcoin coin row (type "coin") has no Token tag', () => {
  render(<AssetRow a={{ ...asset, type: 'coin', chain: 'Bitcoin' }} />)
  expect(screen.queryByText('Token')).not.toBeInTheDocument()
})
