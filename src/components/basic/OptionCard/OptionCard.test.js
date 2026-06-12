import { render, screen, fireEvent } from '@testing-library/react'
import OptionCard from './OptionCard'

const defaultProps = {
  icon: <span data-testid="test-icon">IC</span>,
  title: 'Create wallet',
  description: 'Generate a new seed phrase',
  onClick: jest.fn(),
}

const renderCard = (overrides = {}) =>
  render(
    <OptionCard
      {...defaultProps}
      {...overrides}
    />,
  )

describe('OptionCard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders title and description', () => {
    renderCard()

    expect(screen.getByText('Create wallet')).toBeInTheDocument()
    expect(screen.getByText('Generate a new seed phrase')).toBeInTheDocument()
  })

  it('renders the icon', () => {
    renderCard()

    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('shows default link text "Select"', () => {
    renderCard()

    expect(screen.getByText('Select')).toBeInTheDocument()
  })

  it('shows custom link text when provided', () => {
    renderCard({ linkText: 'Continue' })

    expect(screen.getByText('Continue')).toBeInTheDocument()
    expect(screen.queryByText('Select')).not.toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    renderCard()

    fireEvent.click(screen.getByText('Create wallet'))
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1)
  })

  it('renders arrow SVG inside link area', () => {
    const { container } = renderCard()

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
