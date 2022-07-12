import { render, screen } from '@testing-library/react'
import Svg from './Svg'

test('Render SVG component', () => {
  const [size, width] = [200, '400px']
  const children = <circle r="40" />

  render(
    <Svg
      size={size}
      width={width}
      children={children}
    />,
  )
  const svgContainerComponent = screen.getByTestId('svg-container')

  expect(svgContainerComponent).toBeInTheDocument()
  expect(svgContainerComponent.getAttribute('width')).toBe(width)
  expect(svgContainerComponent.getAttribute('viewBox')).toBe(
    `0 0 ${size} ${size}`,
  )
  expect(svgContainerComponent).not.toBeEmptyDOMElement()
})

test('Render SVG component without children and no width', () => {
  const size = 100

  render(<Svg size={size} />)
  const svgContainerComponent = screen.getByTestId('svg-container')

  expect(svgContainerComponent).toBeInTheDocument()
  expect(svgContainerComponent.getAttribute('width')).toBe('100px')
  expect(svgContainerComponent.getAttribute('viewBox')).toBe(
    `0 0 ${size} ${size}`,
  )
  expect(svgContainerComponent).toBeEmptyDOMElement()
})
