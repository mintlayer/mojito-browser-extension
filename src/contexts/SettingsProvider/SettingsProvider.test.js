import React, { useContext } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import { Browser } from '@Browser'
import { SettingsContext, SettingsProvider } from './SettingsProvider'

// The publish path is the linchpin of grant re-validation: the background
// worker cannot read the wallet pages' localStorage, so chrome.storage.local
// is the only signal it gets. Mock the Browser service to observe exactly
// what the provider writes.
jest.mock('@Browser', () => ({
  Browser: {
    storage: { local: { set: jest.fn() } },
    runtime: { lastError: null },
  },
}))

const mockStorageSet = Browser.storage.local.set

const ToggleProbe = () => {
  const { networkType, toggleNetworkType } = useContext(SettingsContext)
  return (
    <button
      type="button"
      onClick={toggleNetworkType}
    >
      {networkType}
    </button>
  )
}

const renderProvider = () =>
  render(
    <SettingsProvider>
      <ToggleProbe />
    </SettingsProvider>,
  )

describe('SettingsProvider network publish', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockStorageSet.mockClear()
  })

  test('publishes the network on mount', () => {
    renderProvider()

    expect(screen.getByText('mainnet')).toBeInTheDocument()
    expect(mockStorageSet).toHaveBeenCalledTimes(1)
    expect(mockStorageSet).toHaveBeenCalledWith(
      { networkType: 'mainnet' },
      expect.any(Function),
    )
  })

  test('publishes the new network on toggle and never writes other keys', () => {
    renderProvider()
    expect(mockStorageSet).toHaveBeenCalledTimes(1) // mount publish

    fireEvent.click(screen.getByText('mainnet'))

    expect(screen.getByText('testnet')).toBeInTheDocument()
    expect(mockStorageSet).toHaveBeenCalledTimes(2)
    expect(mockStorageSet).toHaveBeenLastCalledWith(
      { networkType: 'testnet' },
      expect.any(Function),
    )

    // ONLY the networkType key is ever written — nothing else may leak into
    // chrome.storage.local through this path.
    for (const call of mockStorageSet.mock.calls) {
      expect(Object.keys(call[0])).toEqual(['networkType'])
    }
  })
})
