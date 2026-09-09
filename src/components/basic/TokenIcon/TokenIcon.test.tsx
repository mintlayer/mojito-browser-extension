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

test('renders the resolved blob icon uri as given', () => {
  // the wallet provider resolves metadata icons to in-memory blob: urls;
  // the component must render them verbatim
  const iconUri = 'blob:chrome-extension://ext-id/abc-123'
  const { getByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri={iconUri}
    />,
  )
  const img = getByTestId('token-icon-image') as HTMLImageElement
  expect(img).toBeInTheDocument()
  expect(img.src).toBe(iconUri)
})

test('falls back to the glyph tile when the icon image fails to load', async () => {
  const { getByTestId, queryByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="blob:chrome-extension://ext-id/broken"
    />,
  )

  fireEvent.error(getByTestId('token-icon-image'))
  await waitFor(() =>
    expect(queryByTestId('token-icon-image')).not.toBeInTheDocument(),
  )
  expect(getByTestId('token-icon')).toHaveTextContent('$')
})

test('never renders a raw ipfs:// uri as the img src', () => {
  // last line of defense: even if a caller leaks an unresolved ipfs:// uri,
  // the component must not hand it to the browser as-is
  render(
    <TokenIcon
      symbol="USDC"
      iconUri="ipfs://bafy/x.png"
    />,
  )
  const img = screen.getByTestId('token-icon-image') as HTMLImageElement
  expect(img.src).not.toMatch(/^ipfs:/)
})
