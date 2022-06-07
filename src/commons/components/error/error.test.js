import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Error from './error'

test('Renders set account page', () => {
  render(<Error />, { wrapper: MemoryRouter })
  const errorComponent = screen.getByTestId('error')
  expect(errorComponent).toBeInTheDocument()
})
