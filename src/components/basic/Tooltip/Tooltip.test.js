import { render, screen } from '@testing-library/react'
import Tooltip from './Tooltip'

describe('Tooltip', () => {
  it('renders correctly when visible', () => {
    render(
      <Tooltip
        message="Test tooltip"
        visible={true}
      />,
    )

    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toHaveTextContent('Test tooltip')
    expect(tooltipElement).toHaveClass('tooltip')
    expect(tooltipElement).toHaveClass('visible')
  })

  it('renders correctly when not visible', () => {
    render(
      <Tooltip
        message="Test tooltip"
        visible={false}
      />,
    )

    const tooltipElement = screen.getByTestId('tooltip')
    expect(tooltipElement).toHaveTextContent('Test tooltip')
    expect(tooltipElement).toHaveClass('tooltip')
    expect(tooltipElement).not.toHaveClass('visible')
  })
})
