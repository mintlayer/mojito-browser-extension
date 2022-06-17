import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import RestoreAccountPage from './index'

test('Renders set account page', () => {
  render(<RestoreAccountPage />, { wrapper: MemoryRouter })
  const setAccountComponent = screen.getByTestId('restore-account')
  expect(setAccountComponent).toBeInTheDocument()
})
