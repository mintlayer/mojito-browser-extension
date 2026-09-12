import { render, screen } from '@testing-library/react'
import Avatar from './Avatar'

test('renders the first letter of the name', () => {
  render(<Avatar name="Main" />)
  expect(screen.getByTestId('avatar')).toHaveTextContent('M')
})

test('applies the requested size', () => {
  render(
    <Avatar
      name="Main"
      size={30}
    />,
  )
  expect(screen.getByTestId('avatar')).toHaveStyle({ width: '30px' })
})
