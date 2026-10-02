import { render, screen } from '@testing-library/react'
import MojitoLogo from './MojitoLogo'

test('renders the logo svg', () => {
  render(<MojitoLogo />)
  expect(screen.getByTestId('mojito-logo')).toBeInTheDocument()
})

test('applies the given size', () => {
  render(<MojitoLogo size={88} />)
  expect(screen.getByTestId('mojito-logo')).toHaveAttribute('width', '88')
  expect(screen.getByTestId('mojito-logo')).toHaveAttribute('height', '88')
})

test('orbit ring renders when animate is true and not when false', () => {
  const { rerender, container } = render(<MojitoLogo animate />)
  expect(container.querySelector('.orbit')).toBeInTheDocument()
  rerender(<MojitoLogo animate={false} />)
  expect(container.querySelector('.orbit')).not.toBeInTheDocument()
})
