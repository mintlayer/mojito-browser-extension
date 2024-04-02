import { render, fireEvent, screen } from '@testing-library/react'
import HelpTooltip from './HelpTooltip'

describe('HelpTooltip', () => {
  it('renders correctly and toggles tooltip on mouse enter and leave', () => {
    render(
      <HelpTooltip
        message="Test tooltip"
        link="https://example.com"
        position="top"
      />,
    )

    const linkElement = screen.getByTestId('help-tooltip-link')
    expect(linkElement).toBeInTheDocument()
    expect(linkElement).toHaveAttribute('href', 'https://example.com')

    fireEvent.mouseEnter(linkElement)
    let tooltipElement = screen.getByText('Test tooltip')
    expect(tooltipElement).toBeInTheDocument()

    fireEvent.mouseLeave(linkElement)
    tooltipElement = screen.queryByText('Test tooltip')
    expect(tooltipElement).toHaveClass('hidden')
  })

  it('renders correctly without link and toggles tooltip on mouse enter and leave', () => {
    render(
      <HelpTooltip
        message="Test tooltip"
        position="bottom"
      />,
    )

    const divElement = screen.getByTestId('help-tooltip')
    expect(divElement).toBeInTheDocument()

    fireEvent.mouseEnter(divElement)
    let tooltipElement = screen.getByText('Test tooltip')
    expect(tooltipElement).toBeInTheDocument()

    fireEvent.mouseLeave(divElement)
    tooltipElement = screen.queryByText('Test tooltip')
    expect(tooltipElement).toHaveClass('hidden')
  })
})
