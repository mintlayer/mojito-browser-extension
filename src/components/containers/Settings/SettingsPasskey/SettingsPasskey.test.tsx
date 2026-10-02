import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import SettingsPasskey from './SettingsPasskey.tsx'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import * as Passkey from '../../../../services/Crypto/Passkey/Passkey'

jest.mock('@Entities', () => ({
  Account: {
    enrollPasskey: jest.fn(),
    removePasskey: jest.fn(),
    getPasskeyBlob: jest.fn(),
  },
  // AddWallet (pulled in through the @ComposedComponents barrel) also imports this
  AccountHelpers: {},
}))

// The component imports the passkey service via this relative path (webpack
// cannot resolve subpaths of the '@Cryptos' alias). Mocking this exact
// specifier (no virtual registration — the module exists, and virtual mocks
// are applied unreliably across suites in --runInBand runs) makes both the
// component's import and the handle imported above resolve to the mock.
jest.mock('../../../../services/Crypto/Passkey/Passkey', () => ({
  isSupported: jest.fn(),
}))

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

    it('shows the incorrect-password message for an unlock-shaped rejection', async () => {
      // unlockAccount rejects a PLAIN OBJECT ({ name: '', error }) with no
      // .message property — it must map to the incorrect-password text.
      mockedEnrollPasskey.mockRejectedValue({
        name: '',
        addresses: {},
        error: 'cipher failure detail',
      })

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent('Incorrect password. Please try again.')
      expect(screen.queryByTestId('passkey-message')).not.toBeInTheDocument()
    })

    it('maps a PASSKEY_UNSUPPORTED message to friendly text', async () => {
      mockedEnrollPasskey.mockRejectedValue(new Error('PASSKEY_UNSUPPORTED'))

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent(
        'This device or browser does not support passkey unlock.',
      )
    })

    it('maps a NotAllowedError DOMException to friendly text', async () => {
      mockedEnrollPasskey.mockRejectedValue({
        name: 'NotAllowedError',
        message: 'NotAllowedError: The user aborted the request.',
      })

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent(
        'The passkey prompt was cancelled or not allowed. Please try again.',
      )
    })

    it('shows the generic message when the rejection is null', async () => {
      mockedEnrollPasskey.mockRejectedValue(null)

      renderComponent()

      await typePassword('wallet-password')
      fireEvent.click(
        screen.getByRole('button', { name: 'Enable passkey unlock' }),
      )

      const error = await screen.findByTestId('passkey-error')
      expect(error).toHaveTextContent('Something went wrong. Please try again.')
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
