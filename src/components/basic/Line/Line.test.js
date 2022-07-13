import { render, screen } from '@testing-library/react'
import Line from './Line'

const POINTSSAMPLE = [
  [0, 10],
  [3, 2],
  [6, 50],
  [9, 30],
  [12, 2],
  [15, 50],
]

test('Render Line component', () => {
  render(
    <svg>
      <Line points={POINTSSAMPLE} />
    </svg>,
  )
  const lineContainerComponent = screen.getByTestId('path-container')

  expect(lineContainerComponent).toBeInTheDocument()
  expect(lineContainerComponent).toBeEmptyDOMElement()
  expect(lineContainerComponent).toHaveAttribute('fill')
  expect(lineContainerComponent).toHaveAttribute('stroke')
})
