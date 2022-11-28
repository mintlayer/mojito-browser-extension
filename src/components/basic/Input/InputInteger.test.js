import { fireEvent, render, screen } from '@testing-library/react'
import InputInteger from './InputInteger'

jest.spyOn(console, 'warn').mockImplementation(() => {
  console.warn.restoreMock()
})

test('InputInteger component', () => {
  render(<InputInteger />)
  const inputComponent = screen.getByTestId('input')
  const value = 1.23
  const warnMessage =
    'A non-integer value was passed to InputInteger. It has been converted to integer.'

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveClass('input')

  fireEvent.change(inputComponent, { target: { value: value } })
  expect(inputComponent).toHaveValue(parseInt(value).toString())

  expect(console.warn).toHaveBeenCalledTimes(1)
  expect(console.warn).toHaveBeenCalledWith(warnMessage)
})
