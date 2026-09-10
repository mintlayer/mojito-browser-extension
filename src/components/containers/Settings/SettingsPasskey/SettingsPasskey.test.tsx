import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import SettingsPasskey from './SettingsPasskey.tsx'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import * as Passkey from '@Cryptos/Passkey/Passkey'

jest.mock('@Entities', () => ({
  Account: {
    enrollPasskey: jest.fn(),
    removePasskey: jest.fn(),
    getPasskeyBlob: jest.fn(),
  },
  // AddWallet (pulled in through the @ComposedComponents barrel) also imports this
  AccountHelpers: {},
}))

// '@Cryptos/Passkey/Passkey' is not mapped in jest.config.js (only the bare
// '@Cryptos' alias is), so jest cannot resolve it from disk — a virtual mock
// registers the module for this exact specifier, which is what the component
// imports.
jest.mock(
  '@Cryptos/Passkey/Passkey',
  () => ({
    isSupported: jest.fn(),
  }),
  { virtual: true },
)

const mockedPasskey = Passkey.isSupported as jest.Mock
const mockedEnrollPasskey = Account.enrollPasskey as jest.Mock
const mockedRemovePasskey = Account.removePasskey as jest.Mock
const mockedGetPasskeyBlob = Account.getPasskeyBlob as jest.Mock

const renderComponent = () =>
  render(
    <AccountContext.Provider value={{ accountID: 'acc-1' }}>
      <SettingsPasskey />
    </AccountContext.Provider>,
  )

const typePassword = async (password: string) => {
  const input = await screen.findByTestId('input')
  fireEvent.change(input, { target: { value: password } })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockedPasskey.mockReturnValue(true)
  mockedGetPasskeyBlob.mockResolvedValue(null)
})

describe('SettingsPasskey', () => {
  describe('when passkeys are not supported', () => {
    it('renders nothing', () => {
      mockedPasskey.mockReturnValue(false)

      renderComponent()

      expect(mockedPasskey).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('settings-passkey')).not.toBeInTheDocument()
    })
  })

  describe('when supported and not enrolled', () => {
    it('shows the not-set-up status and a disabled enable button', async () => {
      renderComponent()

      const status = await screen.findByTestId('passkey-status')
      expect(status).toHaveTextContent(
        'Passkey unlock is not set up for this account.',
      )
      expect(mockedGetPasskeyBlob).toHaveBeenCalledWith('acc-1')

      const enableButton = screen.getByRole('button', {
        name: 'Enable passkey unlock',
      })
      expect(enableButton).toBeDisabled()
    })

    it('enables the button once a password is typed', async () => {
      renderComponent()

      const enableButton = await screen.findByRole('button', {
        name: 'Enable passkey unlock',
      })
      expect(enableButton).toBeDisabled()

      await typePassword('wallet-password')

      expect(enableButton).toBeEnabled()
    })

    it('enrolls the passkey with the account id and typed password', async () => {
      mockedEnrollPasskey.mockResolvedValue(undefined)

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const message = await screen.findByTestId('passkey-message')
      expect(message).toHaveTextContent('Passkey unlock enabled.')
      expect(mockedEnrollPasskey).toHaveBeenCalledTimes(1)
      expect(mockedEnrollPasskey).toHaveBeenCalledWith(
        'acc-1',
        'wallet-password',
      )
    })

    it('shows an error message when enrollment fails', async () => {
      mockedEnrollPasskey.mockRejectedValue(new Error('Something failed'))

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent('Something failed')
      expect(screen.queryByTestId('passkey-message')).not.toBeInTheDocument()
    })
  })

  describe('when supported and already enrolled', () => {
    it('shows the enabled status and the remove button', async () => {
      mockedGetPasskeyBlob.mockResolvedValue({ wrappedKey: 'blob' })

      renderComponent()

      await waitFor(() =>
        expect(screen.getByTestId('passkey-status')).toHaveTextContent(
          'Passkey unlock is enabled.',
        ),
      )
      expect(mockedGetPasskeyBlob).toHaveBeenCalledWith('acc-1')
      expect(
        screen.getByRole('button', { name: 'Remove passkey' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Enable passkey unlock' }),
      ).not.toBeInTheDocument()
    })

    it('keeps the remove button disabled until a password is typed', async () => {
      mockedGetPasskeyBlob.mockResolvedValue({ wrappedKey: 'blob' })

      renderComponent()

      const removeButton = await screen.findByRole('button', {
        name: 'Remove passkey',
      })
      expect(removeButton).toBeDisabled()

      await typePassword('wallet-password')

      expect(removeButton).toBeEnabled()
    })

    it('removes the passkey with the account id and typed password', async () => {
      mockedGetPasskeyBlob.mockResolvedValue({ wrappedKey: 'blob' })
      mockedRemovePasskey.mockResolvedValue(undefined)

      renderComponent()

      const removeButton = await screen.findByRole('button', {
        name: 'Remove passkey',
      })
      expect(removeButton).toBeDisabled()

      await typePassword('wallet-password')
      await waitFor(() => expect(removeButton).toBeEnabled())
      fireEvent.click(removeButton)

      const message = await screen.findByTestId('passkey-message')
      expect(message).toHaveTextContent('Passkey unlock removed.')
      expect(mockedRemovePasskey).toHaveBeenCalledTimes(1)
      expect(mockedRemovePasskey).toHaveBeenCalledWith(
        'acc-1',
        'wallet-password',
      )
    })

    it('shows an error message when removal fails', async () => {
      mockedGetPasskeyBlob.mockResolvedValue({ wrappedKey: 'blob' })
      mockedRemovePasskey.mockRejectedValue(new Error('Something failed'))

      renderComponent()

      const removeButton = await screen.findByRole('button', {
        name: 'Remove passkey',
      })
      expect(removeButton).toBeDisabled()

      await typePassword('wallet-password')
      await waitFor(() => expect(removeButton).toBeEnabled())
      fireEvent.click(removeButton)

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent('Something failed')
    })
  })
})
