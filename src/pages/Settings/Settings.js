import { Header } from '@ComposedComponents'
import { SettingsTestnet } from '@ComposedComponents'
import { useNavigate } from 'react-router-dom'

import './Settings.css'

const SettingsList = [
  {
    component: <SettingsTestnet />,
    value: 'testnet',
  },
]

const SettingsPage = () => {
  const navigate = useNavigate()
  const goToDashboard = () => {
    navigate('/')
  }
  return (
    <>
      <Header customBackAction={goToDashboard} />
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
