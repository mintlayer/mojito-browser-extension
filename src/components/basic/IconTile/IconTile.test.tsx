import { render, screen } from '@testing-library/react'
import IconTile from './IconTile'

test('renders the icon inside a tile', () => {
  render(<IconTile icon="flash" />)
  expect(screen.getByTestId('icon-tile')).toBeInTheDocument()
  expect(screen.getByTestId('icon-flash')).toBeInTheDocument()
})

test('renders custom children instead of an icon when provided', () => {
  render(
    <IconTile icon="">
      <span>7</span>
    </IconTile>,
  )
  expect(screen.getByTestId('icon-tile')).toHaveTextContent('7')
})
