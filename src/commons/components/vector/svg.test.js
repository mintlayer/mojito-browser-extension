import { render, screen } from '@testing-library/react'
import Svg from './svg'

test('Render SVG component', () => {
  const [ size, width ] = [200, '400px']
  const children = <circle r="40"/>

  render(<Svg size={size} width={width} children={children} />)
  const svgContainerComponent = screen.getByTestId('svg-container')

  expect(svgContainerComponent).toBeInTheDocument()
  expect(svgContainerComponent.getAttribute('width')).toBe(width)
  expect(svgContainerComponent.getAttribute('viewBox')).toBe(`0 0 ${size} ${size}`)
  expect(svgContainerComponent).not.toBeEmptyDOMElement()
})

test('Render SVG component without children', () => {
  const [ size, width ] = [100, '200px']

  render(<Svg size={size} width={width} />)
  const svgContainerComponent = screen.getByTestId('svg-container')

  expect(svgContainerComponent).toBeInTheDocument()
  expect(svgContainerComponent.getAttribute('width')).toBe(width)
  expect(svgContainerComponent.getAttribute('viewBox')).toBe(`0 0 ${size} ${size}`)
  expect(svgContainerComponent).toBeEmptyDOMElement()
})
