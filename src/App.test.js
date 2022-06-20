import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

test('Renders react app with no accounts', () => {
  render(<App />, { wrapper: MemoryRouter })
  const createRestoreComponent = screen.getByTestId('create-restore')

  expect(createRestoreComponent).toBeInTheDocument()
})

test('Renders react app with accounts', () => {
  render(<App appHasAccounts={true} />, { wrapper: MemoryRouter })
  const listAccountsComponent = screen.getByTestId('list-accounts')

  expect(listAccountsComponent).toBeInTheDocument()
})
