import { render, screen } from '@testing-library/react'
import CenteredLayout from './centeredLayout'

test('Render CenteredLayout component', () => {
  render(<CenteredLayout />)
  const centeredLayoutComponent = screen.getByTestId(
    'centered-layout-container',
  )

  expect(centeredLayoutComponent).toBeInTheDocument()
  expect(centeredLayoutComponent).toBeEmptyDOMElement()
})

test('Render CenteredLayout with children', () => {
  render(<CenteredLayout>content</CenteredLayout>)
  const centeredLayoutComponent = screen.getByTestId(
    'centered-layout-container',
  )

  expect(centeredLayoutComponent).toBeInTheDocument()
  expect(centeredLayoutComponent).not.toBeEmptyDOMElement()
})
