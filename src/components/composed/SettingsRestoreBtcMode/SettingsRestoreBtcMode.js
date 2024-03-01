import { useContext } from 'react'
import { Toggle } from '@BasicComponents'
import { SettingsContext } from '@Contexts'
import { VerticalGroup } from '@LayoutComponents'

import './SettingsRestoreBtcMode.css'

const SettingsRestoreBtcMode = () => {
  const { restoreBtcMode, toggleRestoreBtcMode } = useContext(SettingsContext)
  const onToggle = () => {
    toggleRestoreBtcMode()
  }
  return (
    <div
      className="settingsBtcRestore"
      data-testid="settings-restore-btc"
    >
      <div className="BtcRestoreDescription">
        <VerticalGroup>
          <h2 data-testid="title">RECOVERY LEGACY BTC MODE</h2>
          <p>
            With the latest update, we've revised how BTC wallet are generated.
            If you have a wallet created before this update, you can restore it
            here. Once you've made the switch, remember to log back in to
            activate the changes.
          </p>
        </VerticalGroup>
      </div>

      <Toggle
        toggled={restoreBtcMode}
        name={'restoreBtcMode'}
        onClick={onToggle}
      />
    </div>
  )
}

export default SettingsRestoreBtcMode
