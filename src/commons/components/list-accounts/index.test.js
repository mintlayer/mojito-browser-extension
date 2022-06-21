import { fireEvent, render, screen } from '@testing-library/react'
import ListAccounts from './index'

const data = {
  accounts: [{ id: '1', name: 'Account Name' }],
  onSelect: jest.fn(),
  onCreate: jest.fn(),
  delay: 1000,
}

test('Renders List Accounts page', () => {
  render(<ListAccounts {...data} />)

  expect(screen.getByTestId('list-accounts')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Account Name' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Create Wallet' }),
  ).toBeInTheDocument()
})

test('Render Carousel onSelect', () => {
  render(<ListAccounts {...data} />)

  fireEvent.click(screen.getByText('Account Name'))
  expect(data.onSelect).toHaveBeenCalled()
})

test('Render button onCreate', () => {
  render(<ListAccounts {...data} />)

  fireEvent.click(screen.getByText('Create Wallet'))
  expect(data.onCreate).toHaveBeenCalled()
})
