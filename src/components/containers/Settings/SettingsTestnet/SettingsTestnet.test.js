import { render, screen, fireEvent } from '@testing-library/react'

import SettingsTestnet from './SettingsTestnet'
import { SettingsContext, MintlayerContext, AccountContext } from '@Contexts'
import { BrowserRouter } from 'react-router'

const toggleNetworkType = jest.fn()
const logout = jest.fn()

test('Render Inputs list item', async () => {
  render(
    <AccountContext.Provider value={{ logout }}>
      <SettingsContext.Provider
        value={{ networkType: 'mainnet', toggleNetworkType }}
      >
        <MintlayerContext.Provider value={{ setAllDataFetching: jest.fn() }}>
          <BrowserRouter>
            <SettingsTestnet />
          </BrowserRouter>
        </MintlayerContext.Provider>
      </SettingsContext.Provider>
      ,
    </AccountContext.Provider>,
  )
  const component = screen.getByTestId('settings-testnet')
  const text = screen.getByTestId('title')

  expect(component).toBeInTheDocument()
  expect(text).toBeInTheDocument()
  expect(text).not.toBeEmptyDOMElement()
})

test('toggles the network type', () => {
  render(
    <AccountContext.Provider value={{ logout }}>
      <SettingsContext.Provider
        value={{ networkType: 'mainnet', toggleNetworkType }}
      >
        <MintlayerContext.Provider value={{ setAllDataFetching: jest.fn() }}>
          <BrowserRouter>
            <SettingsTestnet />
          </BrowserRouter>
          ,
        </MintlayerContext.Provider>
      </SettingsContext.Provider>
      ,
    </AccountContext.Provider>,
  )
  const toggleButton = screen.getAllByTestId('toggle')[0]

  fireEvent.click(toggleButton)
  expect(toggleNetworkType).toHaveBeenCalled()
})
