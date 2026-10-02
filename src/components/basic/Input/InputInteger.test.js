import { fireEvent, render, screen } from '@testing-library/react'
import InputInteger from './InputInteger'

const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

afterAll(() => {
  warnSpy.mockRestore()
})

test('InputInteger warns and coerces a non-integer initial value', () => {
  render(<InputInteger value={1.23} />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveValue('1')

  expect(console.warn).toHaveBeenCalledWith(
    'A non-integer value was passed to InputInteger. It has been converted to integer.',
  )
})

test('InputInteger mask pipeline keeps only the integer part on change', () => {
  render(<InputInteger />)
  const inputComponent = screen.getByTestId('input')

  fireEvent.change(inputComponent, { target: { value: 1.23 } })

  expect(inputComponent).toHaveValue('1')
})
