import { render, screen } from '@testing-library/react'
import CreateRestore from './index'

test('renders learn react link', () => {
  render(<CreateRestore />)
  const linkElement = screen.getByText(/create/i)
  expect(linkElement).toBeInTheDocument()
})
