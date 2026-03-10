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

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('handles newlines between words (copy-paste from password manager)', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1\nword2\nword3' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('handles tabs between words', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1\tword2\tword3' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('handles trailing space without adding empty word', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1 word2 word3 ' },
    })

    expect(mockSetFields).toHaveBeenCalledWith(['word1', 'word2', 'word3'])
  })

  it('handles mixed whitespace (spaces, newlines, tabs)', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'word1  word2\nword3\t word4' },
    })

    expect(mockSetFields).toHaveBeenCalledWith([
      'word1',
      'word2',
      'word3',
      'word4',
    ])
  })

  it('returns empty array for blank input', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: '   ' },
    })

    expect(mockSetFields).toHaveBeenCalledWith([])
  })

  it('does not show counter when input is empty', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    expect(screen.queryByTestId('seed-word-counter')).not.toBeInTheDocument()
  })

  it('shows counter as N/12 when word count is 12 or less', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'word1 word2 word3' } })

    expect(screen.getByTestId('seed-word-counter')).toHaveTextContent('3 / 12')
  })

  it('shows counter as 12/12 when exactly 12 words', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'a b c d e f g h i j k l' },
    })

    expect(screen.getByTestId('seed-word-counter')).toHaveTextContent('12 / 12')
  })

  it('shows counter as N/24 when word count is between 13 and 24', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'a b c d e f g h i j k l m' },
    })

    expect(screen.getByTestId('seed-word-counter')).toHaveTextContent('13 / 24')
  })

  it('shows counter as 24/24 when exactly 24 words', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'a b c d e f g h i j k l m n o p q r s t u v w x' },
    })

    expect(screen.getByTestId('seed-word-counter')).toHaveTextContent('24 / 24')
  })

  it('counter has counter-valid class when accountWordsValid is true', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={true}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'word1 word2' } })

    expect(screen.getByTestId('seed-word-counter')).toHaveClass('counter-valid')
  })

  it('counter does not have counter-valid class when accountWordsValid is false', () => {
    render(
      <RestoreSeedField
        setFields={mockSetFields}
        accountWordsValid={false}
      />,
    )

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'word1 word2' } })

    expect(screen.getByTestId('seed-word-counter')).not.toHaveClass(
      'counter-valid',
    )
  })
})
