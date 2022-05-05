import { render, screen } from '@testing-library/react'
import { Selection } from 'd3-selection/src/selection'
import * as d3 from 'd3'
import {
  createArcGenerator,
  createPieGenerator,
  createTooltip,
  buildArc,
  mouseMoveHandle,
  mouseOverHandle,
  mouseOutHandle
} from './arc'

const ArcData = [
  { value: 10, asset: 'BTC', color: 'orange'},
  { value: 40, asset: 'MLT', color: 'blue'},
  { value: 20, asset: 'ETH', color: 'red'}
]

test('CreateArcGenerator function', () => {
  const generator = createArcGenerator()

  expect(generator).toBeInstanceOf(Function)
  expect(generator.outerRadius()).not.toThrowError()
  expect(generator.innerRadius()).not.toThrowError()
})

test('CreatePieGenerator function', () => {
  const generator = createPieGenerator()

  expect(generator).toBeInstanceOf(Function)
  expect(generator.startAngle()).not.toThrowError()
  expect(generator.startAngle()()).toBe(-0.5 * Math.PI)
  expect(generator.endAngle()).not.toThrowError()
  expect(generator.endAngle()()).toBe(0.5 * Math.PI)
})

test('CreateTooltip function', () => {
  const tooltip = createTooltip()
  const tooltipComponent = screen.getByTestId('tooltip-container')

  expect(tooltip).toBeInstanceOf(Selection)
  expect(tooltipComponent).toBeInTheDocument()
})

test('mouseMoveHandle function', () => {
  const d3Tooltip = d3
    .select('body')
    .append('div')
    .attr('data-testid', 'mousemove-tooltip-container')

  const tooltipContainer = screen.getByTestId('mousemove-tooltip-container')

  mouseMoveHandle(
    d3Tooltip,
    { pageX: 0, pageY: 0 }
  )

  expect(tooltipContainer).toHaveAttribute('style', 'left: 0px; top: -35px;')
})

test('mouseOverHandle function', () => {
  const d3Tooltip = d3
    .select('body')
    .append('div')
    .attr('data-testid', 'mouseover-tooltip-container')

  const item = { data: { value: 10, asset: 'BTC' }}

  const tooltipContainer = screen.getByTestId('mouseover-tooltip-container')

  mouseOverHandle(d3Tooltip, null, item, 0)

  expect(tooltipContainer).toHaveTextContent(`${item.data.asset} ${item.data.value}`)
  expect(tooltipContainer).toHaveAttribute('data-show', 'true')
})

test('mouseOutHandle function', () => {
  const d3Tooltip = d3
    .select('body')
    .append('div')
    .attr('data-testid', 'mouseout-tooltip-container')

  const tooltipContainer = screen.getByTestId('mouseout-tooltip-container')

  mouseOutHandle(d3Tooltip, 0)

  expect(tooltipContainer).toHaveAttribute('data-show', 'false')
})


test('Render Arc', () => {
  render(<div><span data-testid='tooltip-container'></span><svg><g data-testid='arc-container'></g></svg></div>)

  const arcContainer = screen.getByTestId('arc-container')
  const tooltipContainer = screen.getAllByTestId('tooltip-container')

  buildArc({
    container: arcContainer,
    pathData: d3.pie()(ArcData),
    arcGenerator: d3.arc(),
    tooltip: tooltipContainer
  })

  ArcData.forEach(item => {
    const arcItemContainer = screen.getByTestId(`arc-${item.asset}-container`)
    expect(arcItemContainer).toBeInTheDocument()
  })
})
