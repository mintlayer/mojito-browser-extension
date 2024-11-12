// Textarea.test.js

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Textarea from './Textarea'

describe('Textarea Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    extraClasses: '',
    id: 'test-textarea',
    size: { cols: 30, rows: 10 },
    validity: true,
    disabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders without crashing', () => {
    render(<Textarea {...defaultProps} />)
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toBeInTheDocument()
  })

  test('displays the correct initial value', () => {
    render(
      <Textarea
        {...defaultProps}
        value="Initial Value"
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveValue('Initial Value')
  })

  test('calls onChange handler when text is changed', () => {
    render(<Textarea {...defaultProps} />)
    const textareaElement = screen.getByTestId('test-textarea')
    fireEvent.change(textareaElement, { target: { value: 'New Value' } })

    expect(defaultProps.onChange).toHaveBeenCalledTimes(1)
    expect(defaultProps.onChange).toHaveBeenCalledWith({
      target: { value: 'New Value' },
    })
    expect(textareaElement).toHaveValue('New Value')
  })

  test('applies textarea-valid class when value is present and valid', () => {
    render(
      <Textarea
        {...defaultProps}
        value="Valid Input"
        validity={true}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveClass('textarea-valid')
  })

  test('applies textarea-invalid class when value is present and invalid', () => {
    render(
      <Textarea
        {...defaultProps}
        value="Invalid Input"
        validity={false}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveClass('textarea-invalid')
  })

  test('does not apply valid or invalid classes when there is no value', () => {
    render(<Textarea {...defaultProps} />)
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).not.toHaveClass('textarea-valid')
    expect(textareaElement).not.toHaveClass('textarea-invalid')
  })

  test('includes extraClasses when provided', () => {
    render(
      <Textarea
        {...defaultProps}
        extraClasses="extra-class another-class"
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveClass('extra-class')
    expect(textareaElement).toHaveClass('another-class')
  })

  test('renders with correct cols and rows', () => {
    render(
      <Textarea
        {...defaultProps}
        size={{ cols: 50, rows: 20 }}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveAttribute('cols', '50')
    expect(textareaElement).toHaveAttribute('rows', '20')
  })

  test('is read-only when disabled is true', () => {
    render(
      <Textarea
        {...defaultProps}
        disabled={true}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveAttribute('readOnly')
  })

  test('is editable when disabled is false', () => {
    render(
      <Textarea
        {...defaultProps}
        disabled={false}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).not.toHaveAttribute('readOnly')
  })

  test('updates internal state when prop value changes', () => {
    const { rerender } = render(
      <Textarea
        {...defaultProps}
        value="Initial"
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveValue('Initial')

    rerender(
      <Textarea
        {...defaultProps}
        value="Updated"
      />,
    )
    expect(textareaElement).toHaveValue('Updated')
  })

  test('handles empty string value correctly', () => {
    render(
      <Textarea
        {...defaultProps}
        value=""
        validity={true}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveValue('')
    expect(textareaElement).not.toHaveClass('textarea-valid')
    expect(textareaElement).not.toHaveClass('textarea-invalid')
  })

  test('handles undefined value prop correctly', () => {
    render(
      <Textarea
        {...defaultProps}
        value={undefined}
      />,
    )
    const textareaElement = screen.getByTestId('test-textarea')
    expect(textareaElement).toHaveValue('')
    expect(textareaElement).not.toHaveClass('textarea-valid')
    expect(textareaElement).not.toHaveClass('textarea-invalid')
  })
})
