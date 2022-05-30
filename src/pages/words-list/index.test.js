import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import WordsList from './index'

test('Renders Words List page', () => {
  const onSubmit = jest.fn()
  render(<WordsList onSubmit={onSubmit}/>, { wrapper: MemoryRouter })
  const WordsListComponent = screen.getByTestId('words-list-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(1)

  expect(WordsListComponent).toBeInTheDocument()
  expect(WordsListComponent).toHaveAttribute('method', 'POST')
})
