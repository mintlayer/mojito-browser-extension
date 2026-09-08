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

test('maps ipfs:// icon uris to the ipfs.io gateway', () => {
  const { getByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="ipfs://bafyabc/icon.png"
    />,
  )
  const img = getByTestId('token-icon-image') as HTMLImageElement
  expect(img.src).toBe('https://ipfs.io/ipfs/bafyabc/icon.png')
})

test('cycles gateway mirrors on load failure before falling back to the tile', async () => {
  const { getByTestId, queryByTestId } = render(
    <TokenIcon
      symbol="USDC"
      iconUri="https://ipfs.io/ipfs/bafyicon/broken.png"
    />,
  )

  const failUntilTile = async () => {
    // each error moves to the next gateway mirror; exhausting them removes
    // the img and restores the procedural tile
    for (let i = 0; i < 4; i++) {
      const img = queryByTestId('token-icon-image')
      if (!img) break
      fireEvent.error(img)
      await waitFor(() => {})
    }
    await waitFor(() =>
      expect(queryByTestId('token-icon-image')).not.toBeInTheDocument(),
    )
  }

  await failUntilTile()
  expect(getByTestId('token-icon')).toHaveTextContent('$')

  const srcAfterFirstMirror = 'https://dweb.link/ipfs/bafyicon/broken.png'
  // re-render a fresh instance to verify the first mirror swap specifically
  const second = render(
    <TokenIcon
      symbol="USDC"
      iconUri="https://ipfs.io/ipfs/bafyicon/broken.png"
    />,
  )
  fireEvent.error(second.getByTestId('token-icon-image'))
  expect((second.getByTestId('token-icon-image') as HTMLImageElement).src).toBe(
    srcAfterFirstMirror,
  )
})
