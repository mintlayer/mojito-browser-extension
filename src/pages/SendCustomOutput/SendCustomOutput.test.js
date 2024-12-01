import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SendCustomOutput from './SendCustomOutput'
import { AccountContext, SettingsContext } from '@Contexts'
import { useMlWalletInfo } from '@Hooks'
import {
  MLTransaction,
  Account,
  Mintlayer,
  LocalStorageService,
} from '@Helpers'

// Mock Contexts
const mockAccountContext = {
  addresses: {
    mlMainnetAddresses: ['mainnet-address-1'],
    mlTestnetAddresses: ['testnet-address-1'],
  },
  accountID: 'account-1',
}

const mockSettingsContext = {
  networkType: 'mainnet',
}

// Mock Hooks
jest.mock('@Hooks', () => ({
  useMlWalletInfo: jest.fn(),
}))

// Mock Helpers
jest.mock('@Helpers/MLTransaction', () => ({
  calculateCustomTransactionSizeInBytes: jest.fn().mockResolvedValue(1000),
  sendCustomTransaction: jest.fn().mockResolvedValue('transaction-hex'),
}))

jest.mock('@Helpers/Account', () => ({
  unlockAccount: jest.fn().mockResolvedValue({
    mlPrivKeys: {
      mlMainnetPrivateKey: 'priv-key-mainnet',
      mlTestnetPrivateKey: 'priv-key-testnet',
    },
  }),
}))

jest.mock('@Helpers/Mintlayer', () => ({
  broadcastTransaction: jest.fn().mockResolvedValue({ tx_id: 'tx123' }),
}))

jest.mock('@Helpers/LocalStorageService', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}))

describe('SendCustomOutput Component', () => {
  beforeEach(() => {
    useMlWalletInfo.mockReturnValue({
      balance: 1000,
      utxos: [],
      unusedAddresses: { change: 'change-address-1' },
      feerate: 10,
      currentHeight: 100,
    })
  })

  const renderComponent = () =>
    render(
      <AccountContext.Provider value={mockAccountContext}>
        <SettingsContext.Provider value={mockSettingsContext}>
          <SendCustomOutput />
        </SettingsContext.Provider>
      </AccountContext.Provider>,
    )

  test('renders without crashing', () => {
    renderComponent()
    expect(screen.getByText(/Balance: 1000 TML/i)).toBeInTheDocument()
    expect(screen.getByText(/Select template:/i)).toBeInTheDocument()
  })

  test('selecting a template updates customOutput', () => {
    renderComponent()
    const select = screen.getByPlaceholderText('Select')
    fireEvent.change(select, { target: { value: 'Transfer' } })
    const applyButton = screen.getByText('Apply')
    fireEvent.click(applyButton)
    expect(screen.getByPlaceholderText('Custom Output')).toHaveValue(
      JSON.stringify({}, null, 2), // Adjust based on getTemplate implementation
    )
  })

  test('handles input changes correctly', () => {
    renderComponent()
    const input = screen.getByPlaceholderText('Enter name')
    fireEvent.change(input, { target: { value: 'Test Name' } })
    expect(input.value).toBe('Test Name')
  })

  test('validates and displays error on invalid output', async () => {
    renderComponent()
    const validateButton = screen.getByText(
      /Validate and augment with inputs\/outputs/i,
    )
    fireEvent.click(validateButton)
    await waitFor(() => {
      expect(
        screen.getByText(/Please select a custom output template/i),
      ).toBeInTheDocument()
    })
  })

  test('builds transaction when password is correct', async () => {
    LocalStorageService.getItem.mockReturnValue({ name: 'TestAccount' })
    renderComponent()

    // Enter password
    const passwordInput = screen.getByPlaceholderText('Password')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Mock customOutput
    const customOutputTextarea = screen.getByPlaceholderText('Custom Output')
    fireEvent.change(customOutputTextarea, {
      target: { value: JSON.stringify({ type: 'Transfer', value: {} }) },
    })

    // Click Build Transaction
    const buildButton = screen.getByText('Build transaction')
    fireEvent.click(buildButton)

    await waitFor(() => {
      expect(Account.unlockAccount).toHaveBeenCalledWith(
        'account-1',
        'password123',
      )
    })
    await waitFor(() => {
      expect(MLTransaction.sendCustomTransaction).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByText('transaction-hex')).toBeInTheDocument()
    })
  })

  test('broadcasts transaction successfully', async () => {
    LocalStorageService.getItem.mockReturnValue({ name: 'TestAccount' })
    renderComponent()

    // Enter password
    const passwordInput = screen.getByPlaceholderText('Password')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Mock customOutput
    const customOutputTextarea = screen.getByPlaceholderText('Custom Output')
    fireEvent.change(customOutputTextarea, {
      target: { value: JSON.stringify({ type: 'Transfer', value: {} }) },
    })

    // Click Build Transaction
    const buildButton = screen.getByText('Build transaction')
    fireEvent.click(buildButton)

    // Wait for build transaction to complete
    await waitFor(() => {
      expect(Account.unlockAccount).toHaveBeenCalledWith(
        'account-1',
        'password123',
      )
    })
    await waitFor(() => {
      expect(MLTransaction.sendCustomTransaction).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByText('transaction-hex')).toBeInTheDocument()
    })

    // Click Broadcast Transaction
    const broadcastButton = screen.getByText('Broadcast transaction')
    fireEvent.click(broadcastButton)

    await waitFor(() => {
      expect(Mintlayer.broadcastTransaction).toHaveBeenCalledWith(
        'transaction-hex',
      )
    })
    await waitFor(() => {
      expect(LocalStorageService.setItem).toHaveBeenCalled()
    })
  })
})
