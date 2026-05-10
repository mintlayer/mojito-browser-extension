import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RestoreAccountJson from './RestoreAccountJson'
import { AccountProvider, SettingsProvider } from '@Contexts'

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
    btcIv: 'iv',
    mlTestnetPrivKeyIv: 'iv',
    mlMainnetPrivKeyIv: 'iv',
  },
  name: 'Test Wallet',
  salt: 'salt',
  tag: {
    btcTag: 'tag',
    mlTestnetPrivKeyTag: 'tag',
    mlMainnetPrivKeyTag: 'tag',
  },
  seed: {
    btcEncryptedSeed: 'seed',
    encryptedMlMainnetPrivateKey: 'key',
    encryptedMlTestnetPrivateKey: 'key',
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

    expect(screen.getByText('Wallet restored!')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your wallet has been successfully restored from the backup file.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Go to login')).toBeInTheDocument()
  })
})
