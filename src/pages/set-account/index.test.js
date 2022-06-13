import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import SetAccountPage from './index'

test('Renders set account page', () => {
  render(<SetAccountPage />, { wrapper: MemoryRouter })
  const setAccountComponent = screen.getByTestId('set-account')
  expect(setAccountComponent).toBeInTheDocument()
})
