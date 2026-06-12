import { render, screen } from '@testing-library/react'
import BrandPanel from './BrandPanel'

describe('BrandPanel', () => {
  it('renders brand name and subtitle', () => {
    render(<BrandPanel />)

    expect(screen.getByText('Mojito')).toBeInTheDocument()
    expect(screen.getByText(/non-custodial/)).toBeInTheDocument()
    expect(screen.getByText(/Mintlayer wallet/)).toBeInTheDocument()
  })

  it('renders logo SVG', () => {
    const { container } = render(<BrandPanel />)

    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThanOrEqual(1)
  })
})
