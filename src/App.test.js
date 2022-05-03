import { render, screen } from '@testing-library/react'
import App from './App'

test('Renders react app with no accounts', () => {
  render(<App />)
  const createRestoreComponent = screen.getByTestId('create-restore')

  expect(createRestoreComponent).toBeInTheDocument()
})

test('Renders react app with accounts', () => {
  render(<App appHasAccounts={true}/>)
  const listAccountsComponent = screen.getByTestId('list-accounts')

  expect(listAccountsComponent).toBeInTheDocument()
})
