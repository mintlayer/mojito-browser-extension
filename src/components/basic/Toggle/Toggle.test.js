import { render, fireEvent, screen } from '@testing-library/react'
import Toggle from './Toggle'

test('renders without label', () => {
  render(<Toggle />)
  const toggleLabel = screen.getByTestId('toggle-label')
  expect(toggleLabel).toBeInTheDocument()
  expect(toggleLabel).toBeEmptyDOMElement()
})

test('renders the label', () => {
  const label = 'Test Toggle'
  render(<Toggle label={label} />)
  const toggleLabel = screen.getByTestId('toggle-label')
  expect(toggleLabel).toBeInTheDocument()
  expect(toggleLabel).toHaveTextContent(label)
})

test('calls the onClick callback when clicked', () => {
  const handleClick = jest.fn()
  render(<Toggle onClick={handleClick} />)
  const toggleInput = screen.getByTestId('toggle-input')

  fireEvent.click(toggleInput)
  expect(handleClick).toHaveBeenCalledTimes(1)
  expect(handleClick).toHaveBeenCalledWith(true)

  fireEvent.click(toggleInput)
  expect(handleClick).toHaveBeenCalledTimes(2)
  expect(handleClick).toHaveBeenCalledWith(false)
})

test('toggles the state when clicked', () => {
  const handleClick = jest.fn()
  render(<Toggle onClick={handleClick} />)
  const toggleInput = screen.getByTestId('toggle-input')

  fireEvent.click(toggleInput)
  expect(toggleInput).toBeChecked()
  fireEvent.click(toggleInput)
  expect(toggleInput).not.toBeChecked()
})

test('sets the initial state based on the toggled prop', () => {
  render(<Toggle toggled />)
  const toggleInput = screen.getByTestId('toggle-input')

  expect(toggleInput).toBeChecked()
})
