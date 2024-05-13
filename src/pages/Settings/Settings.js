import { SettingsTestnet } from '@ComposedComponents'

import './Settings.css'

const SettingsList = [
  {
    component: <SettingsTestnet />,
    value: 'testnet',
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
