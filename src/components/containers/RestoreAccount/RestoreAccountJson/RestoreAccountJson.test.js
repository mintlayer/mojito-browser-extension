import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RestoreAccountJson from './RestoreAccountJson'
import { AccountProvider, SettingsProvider } from '@Contexts'
import { expect } from '@playwright/test'

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

describe('RestoreAccountJson', () => {
  test('renders initial step correctly', () => {
    render(
      <MemoryRouter>
        <AccountProvider>
          <SettingsProvider
            value={{ networkType: 'testnet', toggleNetworkType }}
          >
            <RestoreAccountJson />
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Select your backup file')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Please select the backup file you want to restore your wallet from.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Upload JSON file')).toBeInTheDocument()
    expect(screen.getByText('Next')).toBeInTheDocument()
  })

  test('displays error message for invalid JSON file', async () => {
    render(
      <MemoryRouter>
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
      <MemoryRouter>
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

    await expect(
      screen.findByText('Uploaded: valid.json'),
    ).resolves.toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))

    expect(screen.getAllByText('Wallet details')).toHaveLength(2)
    expect(screen.getByText('Name:')).toBeInTheDocument()
    expect(screen.getByText('ID:')).toBeInTheDocument()
    expect(screen.getByText('Wallets:')).toBeInTheDocument()

    expect(screen.getByText('Test Wallet')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('WALLET1, WALLET2')).toBeInTheDocument()
  })

  test('calls restoreAccountFromJSON and navigates to home on finish', async () => {
    render(
      <MemoryRouter>
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

    await expect(
      screen.findByText('Uploaded: valid.json'),
    ).resolves.toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))
    fireEvent.click(screen.getByText('Next'))

    expect(screen.getByText('Congraduation!')).toBeInTheDocument()
    expect(
      screen.getByText(
        'You have successfully restored your wallet. Please go to the login page to access your account.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Remember to keep your recovery details safe and secure.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Finish')).toHaveLength(2)
  })
})
