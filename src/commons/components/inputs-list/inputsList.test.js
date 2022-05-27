import { fireEvent, render, screen } from '@testing-library/react'

import InputsList from './inputsList'
import { isInputValid } from './inputsList'

const AMOUNTSAMPLE = 1
const RESTOREMODESAMPLE = true
const words = ['car', 'house', 'cat']

test('Render Inputs list item', () => {
  render(<InputsList
    amount={AMOUNTSAMPLE}
    restoreMode={RESTOREMODESAMPLE}
    wordsList
  />)
  const inputListComponent = screen.getByTestId('inputs-list')
  const inputListItem = screen.getByTestId('inputs-list-item')

  expect(inputListComponent).toBeInTheDocument()
  expect(inputListComponent).toHaveClass('inputs-list')
  expect(inputListComponent).toContainElement(inputListItem)
})

test('should call onChange prop', () => {
  const { rerender } = render(<InputsList
    amount={AMOUNTSAMPLE}
    restoreMode={RESTOREMODESAMPLE}
  />)

  let inputs = screen.getAllByTestId('input')
  let eventData = {
    target: { value: 'car' }
  }

  fireEvent.change(inputs[0],  eventData)

  expect(inputs[0].value).toBe(eventData.target.value)
  expect(inputs[0]).not.toHaveClass('valid')
  expect(inputs[0]).toHaveClass('invalid')

  rerender(<InputsList
    amount={AMOUNTSAMPLE}
    restoreMode={RESTOREMODESAMPLE}
    wordsList={words}
  />)
  inputs = screen.getAllByTestId('input')
  eventData = {
    target: { value: 'house' }
  }

  fireEvent.change(inputs[0],  eventData)
  expect(inputs[0].value).toBe(eventData.target.value)
  expect(inputs[0]).toHaveClass('valid')
  expect(inputs[0]).not.toHaveClass('invalid')
})

test('genNumberClasslist function valid', () => {
  const input = {value: 'car'}
  const validator = isInputValid(input, words)
  expect(validator).toBe(true)
})
