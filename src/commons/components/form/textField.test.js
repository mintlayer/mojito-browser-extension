import { render, screen, waitFor } from '@testing-library/react'
import TextField from './textField'

test('Render TextField component', () => {
  render(<TextField />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  const labelComponent = screen.getByTestId('label')
  const inputComponent = screen.getByTestId('input')

  expect(textFieldComponent).toBeInTheDocument()

  expect(labelComponent).toBeInTheDocument()
  expect(inputComponent).toBeInTheDocument()
})


test('Render TextField component - alternate layout', () => {
  render(<TextField alternate/>)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  const labelComponent = screen.getByTestId('label')

  expect(textFieldComponent).toBeInTheDocument()

  expect(labelComponent).toHaveClass('alternate')
})

test('Render TextField component - password', async () => {
  const { rerender } =  render(<TextField />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  let inputComponent = screen.getByTestId('input')

  expect(textFieldComponent).toBeInTheDocument()

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveAttribute('type', 'text')

  rerender(<TextField password />)
  inputComponent = screen.getByTestId('input')
  await waitFor(() => {
    expect(inputComponent).toHaveAttribute('type', 'password')
  })
})
