import { render, screen, fireEvent } from '@testing-library/react'

import SettingsTestnet from './SettingsTestnet'
import { SettingsContext } from '@Contexts'

const toggleNetworkType = jest.fn()

test('Render Inputs list item', async () => {
  render(
    <SettingsContext.Provider
      value={{ networkType: 'mainnet', toggleNetworkType }}
    >
      <SettingsTestnet />
    </SettingsContext.Provider>,
  )
  const component = screen.getByTestId('settings-testnet')
  const text = screen.getByTestId('title')

  expect(component).toBeInTheDocument()
  expect(text).toBeInTheDocument()
  expect(text).not.toBeEmptyDOMElement()
})

test('toggles the network type', () => {
  render(
    <SettingsContext.Provider
      value={{ networkType: 'mainnet', toggleNetworkType }}
    >
      <SettingsTestnet />
    </SettingsContext.Provider>,
  )
  const toggleButton = screen.getAllByTestId('toggle')[0]

  fireEvent.click(toggleButton)
  expect(toggleNetworkType).toHaveBeenCalled()
})
