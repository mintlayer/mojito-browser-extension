import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TokenIcon from './TokenIcon'

test.each(['BTC', 'ML'])(
  'renders the real chain logo svg for native %s',
  (symbol) => {
    const { getByTestId } = render(
      <TokenIcon
        symbol={symbol}
        native
      />,
    )
    expect(getByTestId('token-icon').querySelector('svg')).toBeInTheDocument()
  },
)

test.each(['BTC', 'ML'])(
  'withholds the chain logo from a non-native %s ticker (spoof regression)',
  (symbol) => {
    // A token's ticker is issuer-chosen, so an attacker token tickeried
    // "ML"/"BTC" must never borrow the official chain logo.
    const { getByTestId } = render(<TokenIcon symbol={symbol} />)
    expect(
      getByTestId('token-icon').querySelector('svg'),
    ).not.toBeInTheDocument()
    // The generic procedural tile renders instead (first-letter fallback).
    expect(getByTestId('token-icon')).toHaveTextContent(symbol[0])
  },
)

test('renders the metadata icon of an ML-tickered token without native (spoof regression)', () => {
  // Previously the ML logo short-circuit suppressed the token's own icon;
  // tokens must always render their metadata icon when available.
  const iconUri = 'https://x/icon.png'
  const { getByTestId, queryByTestId } = render(
    <TokenIcon
      symbol="ML"
      iconUri={iconUri}
    />,
  )
  expect(
    queryByTestId('token-icon').querySelector('svg'),
  ).not.toBeInTheDocument()
  expect(getByTestId('token-icon-image')).toBeInTheDocument()
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
