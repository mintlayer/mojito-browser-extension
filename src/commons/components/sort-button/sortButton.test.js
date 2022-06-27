import { render, screen } from '@testing-library/react'
import SortButton from './sortButton'

const TITLESAMPLE = 'sort'

test('Render sort button', () => {
  render(<SortButton />)
  const sortButtonComponent = screen.getByTestId('sort-button-container')
  const sortButton = screen.getByTestId('button')
  expect(sortButton).toBeInTheDocument()
  expect(sortButtonComponent).toBeInTheDocument()

  expect(sortButton).toHaveClass('button-sort')
})

test('Render sort button with UP prop', () => {
  render(<SortButton up />)
  const sortButtonComponent = screen.getByTestId('sort-button-container')
  const sortButton = screen.getByTestId('button')

  expect(sortButton).toBeInTheDocument()
  expect(sortButtonComponent).toBeInTheDocument()
  expect(sortButton).toHaveClass('button-sort-up')
})

test('Render sort button with title', () => {
  render(<SortButton title={TITLESAMPLE} />)
  const sortButtonComponent = screen.getByTestId('sort-button-container')
  const sortButton = screen.getByTestId('button')
  const sortButtonTitle = screen.getByTestId('sort-button-title')

  expect(sortButton).toBeInTheDocument()
  expect(sortButtonComponent).toBeInTheDocument()
  expect(sortButtonTitle).toBeInTheDocument()

  expect(sortButtonTitle.textContent).toBe(TITLESAMPLE)
})
