import { render, screen } from '@testing-library/react'
import InputsList from './inputsList'
import { isInputValid } from './inputsList'
const AMOUNTSAMPLE = 1
const RESTOREMODESAMPLE = true

test('Render Inputs list item', () => {
  render(<InputsList
    amount={AMOUNTSAMPLE}
    restoreMode={RESTOREMODESAMPLE}
  />)
  const inputListComponent = screen.getByTestId('inputs-list')
  const inputListItem = screen.getByTestId('inputs-list-item')

  expect(inputListComponent).toBeInTheDocument()
  expect(inputListComponent).toHaveClass('inputs-list')
  expect(inputListComponent).toContainElement(inputListItem)
})


//does not work
// test('should call onChange prop', () => {
//   render(<InputsList
//     amount={AMOUNTSAMPLE}
//     restoreMode={RESTOREMODESAMPLE}
//   />)
//   const inputListItem = screen.getByTestId('inputs-list-item')
//   const event = {
//     target: { value: 'the-value' }
//   }
//   const onChangehMock = jest.fn()
//   inputListItem.find('input').simulate('change', event)
//   expect(onChangehMock).toBeCalledWith('the-value')
// })

test('genNumberClasslist function valid', () => {
  const words = ['car', 'house', 'cat']
  const input = {value: 'car'}
  const validator = isInputValid(input, words)
  expect(validator).toBe(true)
})
