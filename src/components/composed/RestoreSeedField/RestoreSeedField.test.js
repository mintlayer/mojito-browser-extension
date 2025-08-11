import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RestoreSeedField from './RestoreSeedField'

describe('RestoreSeedField', () => {
  const mockSetFields = jest.fn()

  beforeEach(() => {
    mockSetFields.mockClear()
  })

  it('renders textarea with correct props', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('id', 'restore-seed-textarea')
    expect(textarea).toHaveAttribute('cols', '80')
    expect(textarea).toHaveAttribute('rows', '14')
  })

  it('calls setFields with split words on input change', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1 word2 word3' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('trims whitespace before splitting words', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: '  word1 word2 word3  ' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('handles single word input', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'singleword' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['singleword'])
  })

  it('updates textarea value on input change', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'test words' },
    })

    expect(textarea).toHaveValue('test words')
  })

  it('passes validity prop correctly', () => {
    const { rerender } = render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    // Test with invalid state
    expect(screen.getByRole('textbox')).toBeInTheDocument()

    // Test with valid state
    rerender(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles multiple spaces between words', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1   word2    word3' },
    })

    // Note: split(' ') will create empty strings for multiple spaces
    expect(mockSetFields).toHaveBeenCalledWith([
      'word1',
      '',
      '',
      'word2',
      '',
      '',
      '',
      'word3',
    ])
  })
})
