import { render, screen } from '@testing-library/react'
import Sparkline from './Sparkline'

test('renders an svg polyline for the data', () => {
  const { container } = render(<Sparkline data={[1, 2, 3, 2]} />)
  expect(screen.getByTestId('sparkline')).toBeInTheDocument()
  expect(container.querySelector('polyline')).toBeInTheDocument()
})

test('applies the requested size', () => {
  render(
    <Sparkline
      data={[1, 2]}
      width={44}
      height={20}
    />,
  )
  expect(screen.getByTestId('sparkline')).toHaveAttribute('width', '44')
  expect(screen.getByTestId('sparkline')).toHaveAttribute('height', '20')
})
