import { render, screen } from '@testing-library/react'
import TokenLogoRound from './TokenLogoRound'

describe('TokenLogoRound', () => {
  it('renders with data-testid', () => {
    render(<TokenLogoRound />)

    expect(screen.getByTestId('token-logo-round')).toBeInTheDocument()
  })

  it('renders text content', () => {
    render(<TokenLogoRound text="ML" />)

    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('renders logo image with alt text', () => {
    render(<TokenLogoRound />)

    const img = screen.getByAltText('Logo')
    expect(img).toBeInTheDocument()
    expect(img.tagName).toBe('IMG')
  })

  it('applies small class when small prop is true', () => {
    render(<TokenLogoRound small />)

    const wrapper = screen.getByTestId('token-logo-round')
    expect(wrapper.className).toContain('small')
  })

  it('does not apply small class by default', () => {
    render(<TokenLogoRound />)

    const wrapper = screen.getByTestId('token-logo-round')
    expect(wrapper.className).not.toContain('small')
  })

  it('renders without text when text prop is omitted', () => {
    const { container } = render(<TokenLogoRound />)

    const wrapper = screen.getByTestId('token-logo-round')
    expect(wrapper.querySelector('img')).toBeInTheDocument()
    expect(container.textContent).toBe('')
  })
})
