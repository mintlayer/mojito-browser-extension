import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Select from './Select'

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  test('renders the select component with placeholder', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Select an option"
      />,
    )

    // Check if placeholder is rendered and is disabled
    const placeholderOption = screen.getByText('Select an option')
    expect(placeholderOption).toBeInTheDocument()
    expect(placeholderOption).toBeDisabled()

    // Check if select element is present
    const selectElement = screen.getByRole('combobox')
    expect(selectElement).toBeInTheDocument()
  })

  test('renders the correct number of options', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={() => {}}
        placeholder="Select an option"
      />,
    )

    // Total options should be options.length + 1 (for placeholder)
    const optionElements = screen.getAllByRole('option')
    expect(optionElements).toHaveLength(options.length + 1)
  })

  test('calls onChange handler when an option is selected', () => {
    const handleChange = jest.fn()
    render(
      <Select
        options={options}
        value=""
        onChange={handleChange}
        placeholder="Select an option"
      />,
    )

    const selectElement = screen.getByRole('combobox')
    fireEvent.change(selectElement, { target: { value: 'option2' } })

    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object))

    // Optionally, check the value passed to onChange
    // const event = handleChange.mock.calls[0][0]
    // expect(event.target.value).toBe('option2')
  })

  test('displays the selected value', () => {
    render(
      <Select
        options={options}
        value="option3"
        onChange={() => {}}
        placeholder="Select an option"
      />,
    )

    const selectElement = screen.getByRole('combobox')
    expect(selectElement).toHaveValue('option3')
  })
})
