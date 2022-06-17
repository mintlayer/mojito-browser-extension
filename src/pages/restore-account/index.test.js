import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import RestoreAccountPage from './index'

test('Renders restore account page', () => {
  render(<RestoreAccountPage />, { wrapper: MemoryRouter })
  const restoreAccountComponent = screen.getByTestId('restore-account')
  expect(restoreAccountComponent).toBeInTheDocument()
})
