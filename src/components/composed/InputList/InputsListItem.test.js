import { render, screen } from '@testing-library/react'

import InputsListItem, { genNumberClasslist } from './InputsListItem'

const NUMBERSAMPLE = 1
const VALUESAMPLE = 'WORD'
const VALIDITYSAMPLE = 'valid'
const ONCHANGEHANDLESAMPLE = () => {}
const RESTOREMODESAMPLE = true

test('Render Inputs list item', () => {
  render(
    <InputsListItem
      number={NUMBERSAMPLE}
      validity={VALIDITYSAMPLE}
      value={VALUESAMPLE}
      onChangeHandle={ONCHANGEHANDLESAMPLE}
      restoreMode={false}
    />,
  )
  const inputComponent = screen.getByTestId('inputs-list-item')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveClass('list-item')
})

test('Render Inputs list item in restore mode', () => {
  render(
    <InputsListItem
      number={NUMBERSAMPLE}
      validity={VALIDITYSAMPLE}
      value={VALUESAMPLE}
      onChangeHandle={ONCHANGEHANDLESAMPLE}
      restoreMode={RESTOREMODESAMPLE}
    />,
  )
  const inputComponent = screen.getByTestId('inputs-list-item')
  const inputNumber = screen.getByTestId('inputs-list-item-number')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toContainElement(inputNumber)
  expect(inputNumber).toHaveClass('number')
  expect(inputComponent).toHaveClass('list-item')
})

test('genNumberClasslist function valid', () => {
  const generator = genNumberClasslist(
    VALUESAMPLE,
    VALIDITYSAMPLE,
    RESTOREMODESAMPLE,
  )
  expect(generator).toBe('number number-finished')
})

test('genNumberClasslist function invalid', () => {
  const VALID = 'invalid'
  const generator = genNumberClasslist(VALUESAMPLE, VALID, RESTOREMODESAMPLE)
  expect(generator).toBe('number number-invalid')
})
