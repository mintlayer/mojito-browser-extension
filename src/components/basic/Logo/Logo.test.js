import React from 'react'
import { render, screen } from '@testing-library/react'
import { AccountProvider, SettingsProvider } from '@Contexts'
import Logo from './Logo'

const toggleNetworkType = jest.fn()

describe('Logo', () => {
  test('renders the component with the mainnet title when account is locked', () => {
    render(
      <SettingsProvider value={{ networkType: 'mainnet', toggleNetworkType }}>
        <Logo unlocked={false} />
      </SettingsProvider>,
    )
    const title = screen.getByText('Mojito')
    expect(title).toBeInTheDocument()
    const testnetMark = screen.queryByText('t')
    expect(testnetMark).not.toBeInTheDocument()
  })

  test('renders the component with the testnet title when account is unlocked and networkType is testnet', () => {
    const isAccountUnlocked = jest.fn(() => true)
    render(
      <AccountProvider value={{ isAccountUnlocked }}>
        <SettingsProvider value={{ networkType: 'testnet', toggleNetworkType }}>
          <Logo unlocked={true} />
        </SettingsProvider>
      </AccountProvider>,
    )
    const title = screen.getByTestId('logo-name')
    const testnetMark = screen.getByTestId('testnet-mark')
    const testnetMessage = screen.getByTestId('testnet-message')

    expect(title).toBeInTheDocument()
    expect(testnetMark).toBeInTheDocument()
    expect(testnetMessage).toBeInTheDocument()
  })

  test('renders the component with the mainnet title when account is unlocked and networkType is mainnet', () => {
    const isAccountUnlocked = jest.fn(() => true)
    render(
      <AccountProvider value={{ isAccountUnlocked }}>
        <SettingsProvider value={{ networkType: 'mainnet', toggleNetworkType }}>
          <Logo unlocked={true} />
        </SettingsProvider>
      </AccountProvider>,
    )
    const title = screen.getByText('Mojito')
    expect(title).toBeInTheDocument()
    const testnetMark = screen.queryByText('t')
    expect(testnetMark).not.toBeInTheDocument()
  })
})
