import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { Passkey } from '@Cryptos'

import SettingsPasskey from './SettingsPasskey'

jest.mock('@Entities', () => ({
  Account: {
    getPasskeys: jest.fn(),
    enrollPasskey: jest.fn(),
    removePasskey: jest.fn(),
  },
}))

const renderComponent = () =>
  render(
    <AccountContext.Provider value={{ accountID: 1 }}>
      <SettingsPasskey />
    </AccountContext.Provider>,
  )

beforeEach(() => {
  jest.clearAllMocks()
  Account.getPasskeys.mockResolvedValue([])
  jest.spyOn(Passkey, 'isSupported').mockReturnValue(true)
})

afterEach(() => jest.restoreAllMocks())

test('SettingsPasskey - lists the enrolled passkeys', async () => {
  Account.getPasskeys.mockResolvedValue([
    { credentialId: 'a', label: 'Laptop', createdAt: 1 },
    { credentialId: 'b', label: 'Phone', createdAt: 2 },
  ])

  renderComponent()

  expect(await screen.findByText('Laptop')).toBeInTheDocument()
  expect(screen.getByText('Phone')).toBeInTheDocument()
})

test('SettingsPasskey - tells the user when the browser cannot do this', async () => {
  Passkey.isSupported.mockReturnValue(false)

  renderComponent()

  expect(
    await screen.findByText('This browser cannot use passkeys for a wallet.'),
  ).toBeInTheDocument()
  expect(screen.queryByTestId('add-passkey')).not.toBeInTheDocument()
})

test('SettingsPasskey - enrolling asks for the password and refreshes the list', async () => {
  Account.enrollPasskey.mockResolvedValue({ credentialId: 'a' })

  renderComponent()

  await userEvent.click(await screen.findByTestId('add-passkey'))
  await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')

  Account.getPasskeys.mockResolvedValue([
    { credentialId: 'a', label: 'Passkey 1', createdAt: 1 },
  ])

  await userEvent.click(screen.getByTestId('confirm-passkey'))

  await waitFor(() =>
    expect(Account.enrollPasskey).toHaveBeenCalledWith({
      accountId: 1,
      password: 'pass',
      label: 'Passkey 1',
    }),
  )
  expect(await screen.findByText('Passkey 1')).toBeInTheDocument()
})

test('SettingsPasskey - a failed enrolment is reported', async () => {
  Account.enrollPasskey.mockRejectedValue('This passkey is already enrolled')

  renderComponent()

  await userEvent.click(await screen.findByTestId('add-passkey'))
  await userEvent.type(screen.getByPlaceholderText('Password'), 'pass')
  await userEvent.click(screen.getByTestId('confirm-passkey'))

  expect(
    await screen.findByText('This passkey is already enrolled'),
  ).toBeInTheDocument()
})

test('SettingsPasskey - removing a passkey refreshes the list', async () => {
  Account.getPasskeys.mockResolvedValue([
    { credentialId: 'a', label: 'Laptop', createdAt: 1 },
  ])
  Account.removePasskey.mockResolvedValue(undefined)

  renderComponent()

  await userEvent.click(await screen.findByTestId('remove-passkey-a'))

  await waitFor(() =>
    expect(Account.removePasskey).toHaveBeenCalledWith({
      accountId: 1,
      credentialId: 'a',
    }),
  )
})
