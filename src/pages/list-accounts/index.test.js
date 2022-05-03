import { render, screen } from '@testing-library/react'
import ListAccounts from './index'

test('renders learn react link', () => {
  render(<ListAccounts />)
  const linkElement = screen.getByText(/list/i)
  expect(linkElement).toBeInTheDocument()
})
