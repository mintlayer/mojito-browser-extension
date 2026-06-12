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
  expect(inputComponent).toHaveClass('listItem')
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
  expect(inputComponent).toHaveClass('listItem')
})

test('genNumberClasslist function valid', () => {
  const generator = genNumberClasslist(
    VALUESAMPLE,
    VALIDITYSAMPLE,
    RESTOREMODESAMPLE,
  )
  expect(generator).toBe('number numberFinished')
})

test('genNumberClasslist function invalid', () => {
  const VALID = 'invalid'
  const generator = genNumberClasslist(VALUESAMPLE, VALID, RESTOREMODESAMPLE)
  expect(generator).toBe('number numberInvalid')
})
