import { render, screen } from '@testing-library/react'
import ArcChart from './ArcChart'

const ArcData = [
  { value: 10, asset: 'BTC', color: 'orange' },
  { value: 40, asset: 'MLT', color: 'blue' },
  { value: 20, asset: 'ETH', color: 'red' },
]

const WIDTHSAMPLE = '300px'
const HEIGHTSAMPLE = '150px'

test('Render ArcChart', () => {
  render(
    <ArcChart
      data={ArcData}
      width={WIDTHSAMPLE}
      height={HEIGHTSAMPLE}
    />,
  )
  const arcChartComponent = screen.getByTestId('svg-container')
  const arcComponent = screen.getByTestId('arc-container')

  expect(arcChartComponent).toBeInTheDocument()
  expect(arcChartComponent.nodeName.toLocaleLowerCase()).toBe('svg')
  expect(arcComponent.nodeName.toLocaleLowerCase()).toBe('g')
  expect(arcChartComponent.getAttribute('width')).toBe(WIDTHSAMPLE)
  expect(arcChartComponent.getAttribute('height')).toBe(HEIGHTSAMPLE)
  expect(arcChartComponent).toContainElement(arcComponent)
})

test('Render ArcChart no width, height and data', () => {
  render(<ArcChart />)
  const arcChartComponent = screen.getByTestId('svg-container')
  const arcComponent = screen.getByTestId('arc-container')

  expect(arcChartComponent).toBeInTheDocument()
  expect(arcChartComponent.nodeName.toLocaleLowerCase()).toBe('svg')
  expect(arcComponent.nodeName.toLocaleLowerCase()).toBe('g')
  expect(arcChartComponent.getAttribute('width')).toBe('200px')
  expect(arcChartComponent.getAttribute('height')).toBe('100px')
  expect(arcChartComponent).toContainElement(arcComponent)
})
