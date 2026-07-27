import { render, screen } from '@testing-library/react'
import * as d3 from 'd3'

import { createArcGenerator, createPieGenerator, buildArc } from './Arc'

const ArcData = [
  { value: 10, asset: 'BTC', color: 'orange' },
  { value: 40, asset: 'ML', color: 'blue' },
  { value: 20, asset: 'ETH', color: 'red' },
]

test('CreateArcGenerator function', () => {
  const generator = createArcGenerator()

  expect(generator).toBeInstanceOf(Function)
  expect(generator.outerRadius()).not.toThrow()
  expect(generator.innerRadius()).not.toThrow()
})

test('CreatePieGenerator function', () => {
  const generator = createPieGenerator()

  expect(generator).toBeInstanceOf(Function)
  expect(generator.startAngle()).not.toThrow()
  expect(generator.startAngle()()).toBe(-0.5 * Math.PI)
  expect(generator.endAngle()).not.toThrow()
  expect(generator.endAngle()()).toBe(0.5 * Math.PI)
})

test('Render Arc', () => {
  render(
    <div>
      <svg>
        <g data-testid="arc-container"></g>
      </svg>
    </div>,
  )

  const arcContainer = screen.getByTestId('arc-container')

  buildArc({
    container: arcContainer,
    pathData: d3.pie()(ArcData),
    arcGenerator: d3.arc(),
  })

  ArcData.forEach((item) => {
    const arcItemContainer = screen.getByTestId(`arc-${item.asset}-container`)
    expect(arcItemContainer).toBeInTheDocument()
  })
})
