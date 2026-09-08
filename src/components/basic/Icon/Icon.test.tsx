import { render } from '@testing-library/react'
import Icon from './Icon'

test('renders the requested icon', () => {
  const { container } = render(<Icon name="lock" />)
  expect(
    container.querySelector('[data-testid="icon-lock"]'),
  ).toBeInTheDocument()
})

test('renders nothing for an unknown icon name', () => {
  const { container } = render(<Icon name="does-not-exist" />)
  expect(container.querySelector('svg')).toBeEmptyDOMElement()
})

test('applies size and color', () => {
  const { container } = render(
    <Icon
      name="plus"
      size={32}
      color="red"
    />,
  )
  const svg = container.querySelector('svg')
  expect(svg).toHaveAttribute('width', '32')
  expect(svg).toHaveAttribute('stroke', 'red')
})
