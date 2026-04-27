import { fireEvent, render, screen } from '@testing-library/react'
import ListAccounts from './Login.tsx'
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
  setDeletingAccount: jest.fn(),
}

test('Renders List Accounts page', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <ListAccounts {...data} />
    </AccountContext.Provider>,
  )

  expect(screen.getByTestId('list-accounts')).toBeInTheDocument()
  expect(screen.getByTestId('carousel-item')).toBeInTheDocument()
  expect(screen.getByTestId('add-wallet-button')).toBeInTheDocument()
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

  fireEvent.click(screen.getByTestId('add-wallet-button'))
  expect(data.onCreate).toHaveBeenCalled()
})
