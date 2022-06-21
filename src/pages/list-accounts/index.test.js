import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ListAccountsPage from './index'

const data = {
  accounts: [{ id: '1', name: 'Account Name' }],
  onSelect: jest.fn(),
  onCreate: jest.fn(),
  delay: 1000,
}

test('Render ListAccountsPage', () => {
  render(<ListAccountsPage {...data} />, { wrapper: MemoryRouter })

  expect(screen.getByTestId('list-accounts')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Account Name' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Create Wallet' }),
  ).toBeInTheDocument()
})

test('Render ListAccountsPage onSelect', async () => {
  render(<ListAccountsPage {...data} />, {
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

test('Render ListAccountsPage onCreate', () => {
  render(<ListAccountsPage {...data} />, {
    wrapper: MemoryRouter,
  })

  fireEvent.click(screen.getByText('Create Wallet'))

  expect(data.onCreate).toHaveBeenCalled()
})

test('Render ListAccountsPage delay 0', () => {
  render(
    <ListAccountsPage
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
