import { render, screen } from '@testing-library/react'
import ListAccounts from './index'

test('Renders List Accounts page', () => {
  render(<ListAccounts />)
  const listAccountsComponent = screen.getByTestId('list-accounts')

  expect(listAccountsComponent).toBeInTheDocument()
})
