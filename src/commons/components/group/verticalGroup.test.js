import { render, screen } from '@testing-library/react'
import VerticalGroup from './verticalGroup'

test('Render Line component', () => {
  render(<VerticalGroup />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toBeEmptyDOMElement()
})

test('Render Line component with children', () => {
  render(<VerticalGroup>content</VerticalGroup>)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).not.toBeEmptyDOMElement()
})
