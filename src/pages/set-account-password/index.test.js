import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SetAccountPassword from './index'

test('Renders Set Account password page', () => {
  render(<SetAccountPassword />, { wrapper: MemoryRouter })
  const setAccountPasswordComponent = screen.getByTestId('set-account-password')

  expect(setAccountPasswordComponent).toBeInTheDocument()
})
