import React from 'react'
import { render, screen } from '@testing-library/react'
import { SettingsProvider } from '@Contexts'
import Logo from './Logo'

describe('Logo', () => {
  test('renders the component without testnet message when networkType is mainnet', () => {
    render(
      <SettingsProvider value={{ networkType: 'mainnet' }}>
        <Logo />
      </SettingsProvider>,
    )
    const logoContainer = screen.getByTestId('logo-container')
    const logo = screen.getByTestId('logo')
    expect(logoContainer).toBeInTheDocument()
    expect(logo).toBeInTheDocument()

    const testnetMessage = screen.queryByTestId('testnet-message')
    expect(testnetMessage).not.toBeInTheDocument()
  })

  test('renders the component with testnet message when networkType is testnet', () => {
    render(
      <SettingsProvider value={{ networkType: 'testnet' }}>
        <Logo />
      </SettingsProvider>,
    )
    const logoContainer = screen.getByTestId('logo-container')
    const logo = screen.getByTestId('logo')
    expect(logoContainer).toBeInTheDocument()
    expect(logo).toBeInTheDocument()

    const testnetMessage = screen.getByTestId('testnet-message')
    expect(testnetMessage).toBeInTheDocument()
    expect(testnetMessage).toHaveTextContent('testnet')
  })
})
