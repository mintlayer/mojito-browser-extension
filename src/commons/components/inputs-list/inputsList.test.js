import { render, screen } from '@testing-library/react'
import InputsList from './inputsList'
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
