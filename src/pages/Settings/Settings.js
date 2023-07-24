import { Header } from '@ComposedComponents'
import { SettingsTestnet } from '@ComposedComponents'

import './Settings.css'

const SettingsList = [
  {
    conmponent: <SettingsTestnet />,
    value: 'testnet',
  },
]

const SettingsPage = () => {
  return (
    <>
      <Header />
      <ul className="settingsWrapper">
        {SettingsList.map((item) => (
          <li
            className="settingsItem"
            key={item.value}
          >
            {item.conmponent}
            <div className="divider" />
          </li>
        ))}
      </ul>
    </>
  )
}

export default SettingsPage
