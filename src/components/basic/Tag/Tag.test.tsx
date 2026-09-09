import { render, screen } from '@testing-library/react'
import Tag from './Tag'

test('renders children', () => {
  render(<Tag>Active</Tag>)
  expect(screen.getByTestId('tag')).toHaveTextContent('Active')
})

test('defaults to grey color variant', () => {
  const { container } = render(<Tag>Hi</Tag>)
  expect(container.firstChild).toHaveClass('grey')
})

test('applies the requested color variant', () => {
  const { container } = render(<Tag c="amber">Token</Tag>)
  expect(container.firstChild).toHaveClass('amber')
})
