import { render, screen, waitFor } from '@testing-library/react'

import TextField from './textField'

const ONCHANGEHANDLESAMPLE = () => {}

test('Render TextField component', () => {
  render(<TextField onChangeHandle={ONCHANGEHANDLESAMPLE} />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  const inputComponent = screen.getByTestId('input')

  expect(textFieldComponent).toBeInTheDocument()

  expect(inputComponent).toBeInTheDocument()
})

test('Render TextField component - label', () => {
  render(<TextField label="testLabel" />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  const labelComponent = screen.getByTestId('label')

  expect(textFieldComponent).toBeInTheDocument()

  expect(labelComponent).toHaveTextContent('testLabel')
})

test('Render TextField component - placeholder', () => {
  render(<TextField placeHolder="PH" />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  const inputComponent = screen.getByTestId('input')

  expect(textFieldComponent).toBeInTheDocument()

  expect(inputComponent).toHaveAttribute('placeholder', 'PH')
})

test('Render TextField component - alternate layout', async () => {
  const { rerender } = render(<TextField label="testLabel" />)
  const textFieldComponent = screen.getByTestId('vertical-group-container')
  let labelComponent = screen.getByTestId('label')

  expect(textFieldComponent).toBeInTheDocument()

  expect(labelComponent).not.toHaveClass('alternate')

  rerender(
    <TextField
      label="testLabel"
      alternate
    />,
  )
  labelComponent = screen.getByTestId('label')
  await waitFor(() => {
    expect(labelComponent).toHaveClass('alternate')
  })
})

test('Render TextField component - password', async () => {
  const { rerender } = render(<TextField />)
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
