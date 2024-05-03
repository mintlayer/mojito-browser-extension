import { SettingsTestnet, SettingsRestoreBtcMode } from '@ComposedComponents'

import './Settings.css'

const SettingsList = [
  {
    component: <SettingsTestnet />,
    value: 'testnet',
  },
  {
    component: <SettingsRestoreBtcMode />,
    value: 'restoreBtcMode',
  },
]

const SettingsPage = () => {
  return (
    <>
      <ul className="settingsWrapper">
        {SettingsList.map((item) => (
          <li
            className="settingsItem"
            key={item.value}
          >
            {item.component}
            <div className="divider" />
          </li>
        ))}
      </ul>
    </>
  )
}

export default SettingsPage
