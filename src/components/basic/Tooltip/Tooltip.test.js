import { render, screen } from '@testing-library/react'
import Tooltip from './Tooltip'

describe('Tooltip', () => {
  it('renders the tooltip message', () => {
    render(
      <Tooltip
        message="Test message"
        visible={true}
        position="top"
      />,
    )
    const tooltipElement = screen.getByText(/Test message/i)
    expect(tooltipElement).toBeInTheDocument()
  })

  it('applies the correct position class', () => {
    render(
      <Tooltip
        message="Test message"
        visible={true}
        position="top"
      />,
    )
    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toHaveClass('top')
  })

  it('applies the hidden class when not visible', () => {
    render(
      <Tooltip
        message="Test message"
        visible={false}
        position="top"
      />,
    )
    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toHaveClass('hidden')
  })

  it('defaults to the bottom position if an invalid position is provided', () => {
    render(
      <Tooltip
        message="Test message"
        visible={true}
        position="invalid"
      />,
    )
    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toHaveClass('bottom')
  })
})
