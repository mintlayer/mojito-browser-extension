import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SettingsAPI from './SettingsAPI'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

const initialCustomServers = {
  mintlayer_testnet: 'https://m-testnet.com',
  mintlayer_mainnet: 'https://m-mainnet.com',
  bitcoin_testnet: 'https://b-testnet.com',
  bitcoin_mainnet: 'https://b-mainnet.com',
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem(
  AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
  initialCustomServers,
)

describe('SettingsAPI', () => {
  beforeEach(() => {
    LocalStorageService.setItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
      initialCustomServers,
    )
  })
  test('renders the SettingsAPI component', () => {
    render(<SettingsAPI />)
    expect(screen.getByTestId('settings-api')).toBeInTheDocument()
    expect(screen.getByTestId('title')).toHaveTextContent('API SERVERS')
    expect(screen.getAllByTestId('description')).toHaveLength(2)
    expect(screen.getAllByTestId('input')).toHaveLength(4)
    expect(screen.getAllByRole('button')).toHaveLength(8)
  })

  test('loads current servers from local storage', () => {
    const servers = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(servers).toEqual(initialCustomServers)

    render(<SettingsAPI />)

    const inputs = screen.getAllByTestId('input')

    expect(inputs[0]).toHaveAttribute(
      'placeholder',
      initialCustomServers.mintlayer_testnet,
    )
    expect(inputs[1]).toHaveAttribute(
      'placeholder',
      initialCustomServers.mintlayer_mainnet,
    )
    expect(inputs[2]).toHaveAttribute(
      'placeholder',
      initialCustomServers.bitcoin_testnet,
    )
    expect(inputs[3]).toHaveAttribute(
      'placeholder',
      initialCustomServers.bitcoin_mainnet,
    )
  })

  test('handles submit successfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    )

    render(<SettingsAPI />)

    const customServersFromStorage = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(customServersFromStorage).toEqual(initialCustomServers)

    const input = screen.getByLabelText(/mintlayer testnet server/i)
    fireEvent.change(input, {
      target: { value: 'https://valid-mintlayer-testnet.com' },
    })

    const submitButton = screen.getAllByRole('button', { name: /submit/i })[0] // Use the first submit button
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('success-api-feedback')).toBeInTheDocument()
    })

    const customServersFromStorageAfterSubmit = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(customServersFromStorageAfterSubmit).not.toEqual(
      initialCustomServers,
    )

    expect(customServersFromStorageAfterSubmit.mintlayer_testnet).toEqual(
      'https://valid-mintlayer-testnet.com',
    )
  })

  test('handles submit unsuccessfully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
      }),
    )

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(<SettingsAPI />)

    const customServersFromStorage = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(customServersFromStorage).toEqual(initialCustomServers)

    const input = screen.getByLabelText(/mintlayer testnet server/i)
    fireEvent.change(input, {
      target: { value: 'https://invalid-mintlayer-testnet.com' },
    })

    const submitButton = screen.getAllByRole('button', { name: /submit/i })[0] // Use the first submit button
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid mintlayer testnet server:',
        expect.any(Error),
      )
    })

    const customServersFromStorageAfterSubmit = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )
    expect(customServersFromStorageAfterSubmit).toEqual(initialCustomServers)
  })

  test('handles reset', () => {
    render(<SettingsAPI />)

    const customServersFromStorage = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(customServersFromStorage).toEqual(initialCustomServers)

    const resetButton = screen.getAllByRole('button', { name: /reset/i })[0] // Use the first reset button
    fireEvent.click(resetButton)

    const customServersFromStorageAfterReset = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )

    expect(customServersFromStorageAfterReset).toEqual({
      mintlayer_mainnet: 'https://m-mainnet.com',
      bitcoin_testnet: 'https://b-testnet.com',
      bitcoin_mainnet: 'https://b-mainnet.com',
    })
  })
})
