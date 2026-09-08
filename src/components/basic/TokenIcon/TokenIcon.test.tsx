import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TokenIcon from './TokenIcon'

test.each(['BTC', 'ML'])('renders the real chain logo svg for %s', (symbol) => {
  const { getByTestId } = render(<TokenIcon symbol={symbol} />)
  expect(getByTestId('token-icon').querySelector('svg')).toBeInTheDocument()
})

test('renders with the symbol glyph for known non-chain tokens', () => {
  render(<TokenIcon symbol="ETH" />)
  expect(screen.getByTestId('token-icon')).toHaveTextContent('Ξ')
})

test('falls back to the first letter for unknown tokens', () => {
  render(<TokenIcon symbol="CBEAT" />)
  expect(screen.getByTestId('token-icon')).toHaveTextContent('C')
})

test('applies the requested size', () => {
  render(
    <TokenIcon
      symbol="ML"
      size={48}
    />,
  )
  expect(screen.getByTestId('token-icon')).toHaveStyle({ width: '48px' })
})

test('renders the token metadata icon when an iconUri is provided', () => {
  const { getByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="https://example.com/mlusdc.png"
    />,
  )
  const img = getByTestId('token-icon-image') as HTMLImageElement
  expect(img).toBeInTheDocument()
  expect(img.src).toBe('https://example.com/mlusdc.png')
})

test('maps ipfs:// icon uris to a public gateway', () => {
  const { getByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="ipfs://bafyabc/icon.png"
    />,
  )
  const img = getByTestId('token-icon-image') as HTMLImageElement
  expect(img.src).toBe('https://gateway.ipfs.io/ipfs/bafyabc/icon.png')
})

test('falls back to the procedural tile when the icon fails to load', async () => {
  const { getByTestId, queryByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="https://example.com/broken.png"
    />,
  )

  // jsdom may report the load failure on its own; if the img is still
  // there, drive the failure the way a browser would.
  const img = queryByTestId('token-icon-image')
  if (img) fireEvent.error(img)

  await waitFor(() =>
    expect(queryByTestId('token-icon-image')).not.toBeInTheDocument(),
  )
  expect(getByTestId('token-icon')).toHaveTextContent('$')
})
