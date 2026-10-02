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
      <Line
        points={POINTSSAMPLE}
        height={50}
      />
    </svg>,
  )
  const lineContainerComponent = screen.getByTestId('path-container')

  expect(lineContainerComponent).toBeInTheDocument()
  expect(lineContainerComponent).toHaveAttribute('fill')
  expect(lineContainerComponent).toHaveAttribute('stroke')

  const pathData = lineContainerComponent.getAttribute('d')
  expect(pathData).toBeTruthy()
  expect(pathData).not.toContain('NaN')
})

test('Render Line component renders nothing when points are empty', () => {
  const { container } = render(
    <svg>
      <Line
        points={[]}
        height={50}
      />
    </svg>,
  )

  expect(container.querySelector('path')).toBeNull()
})

test('Render Line component with a flat series', () => {
  render(
    <svg>
      <Line
        points={[
          [0, 10],
          [3, 10],
          [6, 10],
        ]}
        height={50}
      />
    </svg>,
  )
  const lineContainerComponent = screen.getByTestId('path-container')

  const pathData = lineContainerComponent.getAttribute('d')
  expect(pathData).toBeTruthy()
  expect(pathData).not.toContain('NaN')
})

test('Render Line component renders nothing when height is missing', () => {
  const { container } = render(
    <svg>
      <Line points={POINTSSAMPLE} />
    </svg>,
  )

  expect(container.querySelector('path')).toBeNull()
})

test('Render Line component renders nothing when points are omitted', () => {
  const { container } = render(
    <svg>
      <Line height={50} />
    </svg>,
  )

  expect(container.querySelector('path')).toBeNull()
})
