import { render, screen, waitFor } from '@testing-library/react'
import VerticalGroup from './verticalGroup'

test('Render VerticalGroup component', () => {
  render(<VerticalGroup />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toBeEmptyDOMElement()
})

test('Render VerticalGroup component with children', () => {
  render(<VerticalGroup>content</VerticalGroup>)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).not.toBeEmptyDOMElement()
})

test('Render VerticalGroup component - bigGap', async () => {
  const { rerender } = render(<VerticalGroup/>)
  let vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).not.toHaveClass('bigGap')

  rerender(<VerticalGroup bigGap />)
  vGroupComponent = screen.getByTestId('vertical-group-container')
  await waitFor(() => {
    expect(vGroupComponent).toHaveClass('bigGap')
  })
})
