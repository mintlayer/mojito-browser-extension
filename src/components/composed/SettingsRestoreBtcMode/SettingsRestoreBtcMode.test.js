import { render, screen, fireEvent } from '@testing-library/react'

import SettingsRestoreBtcMode from './SettingsRestoreBtcMode'
import { SettingsContext } from '@Contexts'

const toggleRestoreBtcMode = jest.fn()

test('Render Inputs list item', async () => {
  render(
    <SettingsContext.Provider
      value={{ restoreBtcMode: 'false', toggleRestoreBtcMode }}
    >
      <SettingsRestoreBtcMode />
    </SettingsContext.Provider>,
  )
  const component = screen.getByTestId('settings-restore-btc')
  const text = screen.getByTestId('title')

  expect(component).toBeInTheDocument()
  expect(text).toBeInTheDocument()
  expect(text).not.toBeEmptyDOMElement()
})

test('toggles the network type', () => {
  render(
    <SettingsContext.Provider
      value={{ restoreBtcMode: 'false', toggleRestoreBtcMode }}
    >
      <SettingsRestoreBtcMode />
    </SettingsContext.Provider>,
  )
  const toggleButton = screen.getAllByTestId('toggle')[0]

  fireEvent.click(toggleButton)
  expect(toggleRestoreBtcMode).toHaveBeenCalled()
})
