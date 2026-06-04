import { render, screen } from '@testing-library/react'
import SwapTokenLogo from './SwapTokenLogo'

describe('SwapTokenLogo', () => {
  it('renders ML logo SVG when tokenId is undefined', () => {
    render(<SwapTokenLogo />)

    const wrapper = screen.getByTestId('swap-token-logo')
    expect(wrapper).toBeInTheDocument()
    expect(wrapper.querySelector('svg')).toBeInTheDocument()
  })

  it('renders ticker first letter as fallback for unknown tokenId', () => {
    render(
      <SwapTokenLogo
        tokenId="unknown-token"
        ticker="USDT"
      />,
    )

    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('renders empty when unknown tokenId and no ticker', () => {
    render(<SwapTokenLogo tokenId="unknown-token" />)

    const wrapper = screen.getByTestId('swap-token-logo')
    expect(wrapper.querySelector('svg')).not.toBeInTheDocument()
    expect(wrapper.querySelector('span')).not.toBeInTheDocument()
  })

  it('applies small class by default', () => {
    render(<SwapTokenLogo />)

    const wrapper = screen.getByTestId('swap-token-logo')
    expect(wrapper.className).not.toContain('big')
  })

  it('applies big class when size is "big"', () => {
    render(<SwapTokenLogo size="big" />)

    const wrapper = screen.getByTestId('swap-token-logo')
    expect(wrapper.className).toContain('big')
  })

  it('renders fallback span with correct class for ticker', () => {
    const { container } = render(
      <SwapTokenLogo
        tokenId="some-token"
        ticker="BTC"
      />,
    )

    const fallback = container.querySelector('.swap-token-logo-fallback')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveTextContent('B')
  })
})
