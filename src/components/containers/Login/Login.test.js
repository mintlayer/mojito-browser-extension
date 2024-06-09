import { fireEvent, render, screen } from '@testing-library/react'
import ListAccounts from './Login'
import { AccountContext } from '@Contexts'

const data = {
  accounts: [{ id: '1', name: 'Account Name' }],
  onSelect: jest.fn(),
  onCreate: jest.fn(),
  delay: 1000,
}

const mockContext = {
  logout: jest.fn(),
  verifyAccountsExistence: jest.fn(),
  deletingAccount: { id: '1', addresses: ['address1'] },
  setRemoveAccountPopupOpen: jest.fn(),
}

test('Renders List Accounts page', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <ListAccounts {...data} />
    </AccountContext.Provider>,
  )

  expect(screen.getByTestId('list-accounts')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Account Name' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add Wallet' })).toBeInTheDocument()
})

test('Render Carousel onSelect', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <ListAccounts {...data} />
    </AccountContext.Provider>,
  )

  fireEvent.click(screen.getByText('Account Name'))
  expect(data.onSelect).toHaveBeenCalled()
})

test('Render button onCreate', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <ListAccounts {...data} />
    </AccountContext.Provider>,
  )

  fireEvent.click(screen.getByText('Add Wallet'))
  expect(data.onCreate).toHaveBeenCalled()
})
