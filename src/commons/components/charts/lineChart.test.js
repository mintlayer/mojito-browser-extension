import { render, screen } from '@testing-library/react'
import LineChart, {
  maxWidthPoint,
  maxHeightPoint,
  getProportionalHeight,
  EXTRABOUNDARIES,
} from './lineChart'

const MAXY = 50
const MAXX = 15
const POINTSSAMPLE = [
  [0, 10],
  [3, 2],
  [6, MAXY],
  [9, 30],
  [12, 2],
  [MAXX, 40],
]
const WIDTHSAMPLE = '400px'
const PROPORTIONALHEIGHTSAMPLE = '1100px'

test('Render LineChart', () => {
  render(
    <LineChart
      points={POINTSSAMPLE}
      width={WIDTHSAMPLE}
    />,
  )
  const lineChartComponent = screen.getByTestId('svg-container')
  const lineComponent = screen.getByTestId('path-container')

  expect(lineChartComponent).toBeInTheDocument()
  expect(lineChartComponent.nodeName.toLocaleLowerCase()).toBe('svg')
  expect(lineChartComponent.getAttribute('width')).toBe(WIDTHSAMPLE)
  expect(lineChartComponent.getAttribute('height')).toBe(
    PROPORTIONALHEIGHTSAMPLE,
  )
  expect(lineChartComponent).toContainElement(lineComponent)
})

test('Render LineChart no width', () => {
  render(<LineChart points={POINTSSAMPLE} />)
  const lineChartComponent = screen.getByTestId('svg-container')
  const lineComponent = screen.getByTestId('path-container')

  expect(lineChartComponent).toBeInTheDocument()
  expect(lineChartComponent.nodeName.toLocaleLowerCase()).toBe('svg')
  expect(lineChartComponent.getAttribute('width')).toBe('100px')
  expect(lineChartComponent.getAttribute('height')).toBe('275px')
  expect(lineChartComponent).toContainElement(lineComponent)
})

test('Get max x point of line chart', () => {
  expect(maxWidthPoint(POINTSSAMPLE)).toBe(MAXX)
})

test('Get max y point of line chart', () => {
  expect(maxHeightPoint(POINTSSAMPLE)).toBe(MAXY)
})

test('Get proportional height', () => {
  expect(
    getProportionalHeight(
      { w: MAXX + EXTRABOUNDARIES, h: MAXY + EXTRABOUNDARIES },
      WIDTHSAMPLE,
    ),
  ).toBe(PROPORTIONALHEIGHTSAMPLE)
})
