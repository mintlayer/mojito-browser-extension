import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RestoreAccountJson from './RestoreAccountJson'
import { AccountProvider, SettingsProvider } from '@Contexts'
import { Account } from '@Entities'

jest.mock('@Entities', () => ({
  Account: {
    restoreAccountFromJSON: jest.fn(),
  },
  NetworkTypeEntity: {
    get: jest.fn(),
    set: jest.fn(),
  },
}))

const toggleNetworkType = jest.fn()

const validJson = JSON.stringify({
  id: 1,
  iv: {
    btcIv: 'a1b2c3d4e5f60718293a4b5c',
    mlTestnetPrivKeyIv: 'b2c3d4e5f60718293a4b5c6d',
    mlMainnetPrivKeyIv: 'c3d4e5f60718293a4b5c6d7e',
  },
  name: 'Test Wallet',
  salt: 'd4e5f60718293a4b5c6d7e8f9a0b1c2d',
  tag: {
    btcTag: 'e5f60718293a4b5c6d7e8f9a0b1c2d3e',
    mlTestnetPrivKeyTag: 'f60718293a4b5c6d7e8f9a0b1c2d3e4f',
    mlMainnetPrivKeyTag: '0718293a4b5c6d7e8f9a0b1c2d3e4f5a',
  },
  seed: {
    btcEncryptedSeed: '18293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    encryptedMlMainnetPrivateKey: '293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    encryptedMlTestnetPrivateKey: '3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
  },
  walletType: 'type',
  walletsToCreate: ['wallet1', 'wallet2'],
})

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

describe('RestoreAccountJson', () => {
  test('renders initial step correctly', () => {
    render(
      <MemoryRouter future={memoryRouterFeature}>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Select backup file')).toBeInTheDocument()
    expect(
      screen.getByText('Choose the JSON file exported from Mojito Wallet'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Drag & drop or click to upload'),
    ).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  test('displays error message for invalid JSON file', async () => {
    render(
      <MemoryRouter future={memoryRouterFeature}>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    const fileInput = screen.getByTestId('file-input')
    const invalidJsonContent = '{ invalid: "data" }' // Invalid JSON content
    const file = new File([invalidJsonContent], 'invalid.json', {
      type: 'application/json',
    })

    // Simulate the file input change event with the correct file object
    fireEvent.change(fileInput, { target: { files: [file] } })

    await expect(
      screen.findByText('Invalid JSON file.'),
    ).resolves.toBeInTheDocument()
  })

  test('displays wallet details after valid JSON file upload', async () => {
    render(
      <MemoryRouter future={memoryRouterFeature}>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    const fileInput = screen.getByTestId('file-input')
    const file = new File([validJson], 'valid.json', {
      type: 'application/json',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByText('Next')).toBeInTheDocument()

    await expect(screen.findByText('valid.json')).resolves.toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))

    expect(screen.getByText('Confirm wallet details')).toBeInTheDocument()
    expect(screen.getByText('Wallet Name')).toBeInTheDocument()
    expect(screen.getByText('Wallet ID')).toBeInTheDocument()
    expect(screen.getByText('Assets')).toBeInTheDocument()

    expect(screen.getByText('Test Wallet')).toBeInTheDocument()
    expect(screen.getByText('#1')).toBeInTheDocument()
    expect(screen.getByText('WALLET1, WALLET2')).toBeInTheDocument()
  })

  test('calls restoreAccountFromJSON and navigates to home on finish', async () => {
    render(
      <MemoryRouter future={memoryRouterFeature}>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    const fileInput = screen.getByTestId('file-input')
    const file = new File([validJson], 'valid.json', {
      type: 'application/json',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(screen.getByText('Next')).toBeInTheDocument()

    await expect(screen.findByText('valid.json')).resolves.toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Restore wallet'))

    expect(Account.restoreAccountFromJSON).toHaveBeenCalled()

    await expect(
      screen.findByText('Wallet restored!'),
    ).resolves.toBeInTheDocument()
    expect(
      screen.getByText(
        'Your wallet has been successfully restored from the backup file.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Go to login')).toBeInTheDocument()
  })

  test('renders error message when restoreAccountFromJSON rejects', async () => {
    Account.restoreAccountFromJSON.mockRejectedValueOnce(
      new Error('restore failed'),
    )

    render(
      <MemoryRouter future={memoryRouterFeature}>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    const fileInput = screen.getByTestId('file-input')
    const file = new File([validJson], 'valid.json', {
      type: 'application/json',
    })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await expect(screen.findByText('valid.json')).resolves.toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Restore wallet'))

    expect(Account.restoreAccountFromJSON).toHaveBeenCalled()

    // the restore failed, so the wallet details view stays on step 2 with the error
    await expect(
      screen.findByText('Error restoring account from JSON file.'),
    ).resolves.toBeInTheDocument()
    expect(screen.getByText('Wallet Name')).toBeInTheDocument()
    expect(screen.queryByText('Wallet restored!')).not.toBeInTheDocument()
  })
})
