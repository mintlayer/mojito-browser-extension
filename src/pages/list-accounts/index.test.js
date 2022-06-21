import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListAccounts, { ListAccountsContainer } from './index'

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

test('Render ListAccountsContainer', () => {
  render(<ListAccountsContainer {...data} />, { wrapper: MemoryRouter })

  expect(screen.getByTestId('list-accounts')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Account Name' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Create Wallet' }),
  ).toBeInTheDocument()
})

test('Render ListAccountsContainer onSelect', async () => {
  render(<ListAccountsContainer {...data} />, {
    wrapper: MemoryRouter,
  })

  const selectAccount = screen.getByText(data.accounts[0].name)
  fireEvent.click(selectAccount)

  expect(screen.getByTestId('generic')).toHaveClass('animate-list-accounts')
  await waitForElementToBeRemoved(
    () => screen.queryByText(data.accounts[0].name),
    { timeout: 1000 },
  )
  expect(screen.getByText('Set password')).toBeInTheDocument()
  await waitFor(
    () =>
      expect(screen.getByTestId('generic')).not.toHaveClass(
        'animate-list-accounts',
      ),
    { timeout: 1000 },
  )
})

test('Render ListAccountsContainer onCreate', () => {
  render(<ListAccountsContainer {...data} />, {
    wrapper: MemoryRouter,
  })

  fireEvent.click(screen.getByText('Create Wallet'))

  expect(data.onCreate).toHaveBeenCalled()
})

test('Render ListAccountsContainer delay 0', () => {
  render(
    <ListAccountsContainer
      {...data}
      delay={0}
    />,
    {
      wrapper: MemoryRouter,
    },
  )

  const selectAccount = screen.getByText(data.accounts[0].name)
  fireEvent.click(selectAccount)
  expect(screen.getByText('Set password')).toBeInTheDocument()
})
