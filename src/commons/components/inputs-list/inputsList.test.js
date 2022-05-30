import { fireEvent, render, screen } from '@testing-library/react'

import InputsList from './inputsList'
import { isInputValid } from './inputsList'

const AMOUNTSAMPLE = 1
const RESTOREMODESAMPLE = true
const WORDS = ['car', 'house', 'cat']
const setValue = jest.fn()
const FIELDSSAMPLEINVALID = [{ order: 0, validity: false, value: '' }]
const FIELDSSAMPLEVALID = [{ order: 0, validity: true, value: '' }]

test('Render Inputs list item', () => {
  render(<InputsList
    amount={AMOUNTSAMPLE}
    restoreMode={RESTOREMODESAMPLE}
    fields = {FIELDSSAMPLEINVALID}
    setFields={setValue}
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
    fields = {FIELDSSAMPLEINVALID}
    setFields={setValue}
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
    wordsList={WORDS}
    fields = {FIELDSSAMPLEVALID}
    setFields={setValue}
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
  const validator = isInputValid(input, WORDS)
  expect(validator).toBe(true)
})

test('genNumberClasslist function invalid', () => {
  const input = {value: 'tree'}
  const validator = isInputValid(input, WORDS)
  expect(validator).toBe(false)
})

test('genNumberClasslist function without words array', () => {
  const input = {value: 'tree'}
  const validator = isInputValid(input)
  expect(validator).toBe(true)
})
