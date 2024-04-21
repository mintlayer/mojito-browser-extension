import { useContext } from 'react'
import { Toggle } from '@BasicComponents'
import { SettingsContext } from '@Contexts'
import { VerticalGroup } from '@LayoutComponents'
import { AppInfo } from '@Constants'

import './SettingsTestnet.css'

const SettingsTestnet = () => {
  const { networkType, toggleNetworkType } = useContext(SettingsContext)
  const isTestnetEnabled = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const onToggle = () => {
    toggleNetworkType()
  }
  return (
    <div
      className="settingsTestnet"
      data-testid="settings-testnet"
    >
      <div className="testnetDescription">
        <VerticalGroup>
          <h2 data-testid="title">TESTNET MODE</h2>
          <p>
            With Testnet mode, you can test transactions without the need for
            actual coins. This is useful for testing purposes.
          </p>
        </VerticalGroup>
      </div>

      <Toggle
        toggled={isTestnetEnabled}
        onClick={onToggle}
        label={'testnet switcher'}
      />
    </div>
  )
}

export default SettingsTestnet
