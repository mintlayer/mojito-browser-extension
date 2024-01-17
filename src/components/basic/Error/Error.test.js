import React from 'react'
import { render, screen } from '@testing-library/react'
import Error from './Error'

const SINGLE_ERROR = 'This is an error message'
const MULTIPLE_ERRORS = [
  'Error message 1',
  'Error message 2',
  'Error message 3',
]

test('Renders with single error message', () => {
  render(<Error error={SINGLE_ERROR} />)
  const error = screen.getByTestId('error')
  const message = screen.getByTestId('error-message')

  expect(error).toBeInTheDocument()
  expect(message).toBeInTheDocument()
  expect(message).toHaveTextContent(SINGLE_ERROR)
})

test('Renders with multiple error message', () => {
  render(<Error error={MULTIPLE_ERRORS} />)
  const error = screen.getByTestId('error')
  const messages = screen.getAllByTestId('error-message')

  expect(error).toBeInTheDocument()
  MULTIPLE_ERRORS.forEach((message, index) => {
    expect(messages[index]).toHaveTextContent(message)
  })
})
