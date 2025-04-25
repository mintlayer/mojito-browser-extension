import { useContext } from 'react'
import { Toggle } from '@BasicComponents'
import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import { VerticalGroup } from '@LayoutComponents'
import { AppInfo } from '@Constants'

import './SettingsTestnet.css'
import { useNavigate } from 'react-router-dom'

const SettingsTestnet = () => {
  const { networkType, toggleNetworkType } = useContext(SettingsContext)
  const { logout } = useContext(AccountContext)
  const navigate = useNavigate()
  const { setAllDataFetching } = useContext(MintlayerContext)
  const isTestnetEnabled = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const onToggle = () => {
    setAllDataFetching(false)
    toggleNetworkType()

    logout()
    navigate('/')
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
          <p>
            <b>NOTE</b>: When you switch network mode, you need to login again
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
