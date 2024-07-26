// import { useState, useContext } from 'react'
import { Settings } from '@ContainerComponents'
// import { AccountContext } from '@Contexts'
// import { Account } from '@Entities'
// import { useNavigate } from 'react-router-dom'

import './Settings.css'

const SettingsList = [
  {
    component: <Settings.SettingsTestnet />,
    value: 'testnet',
  },
  {
    component: <Settings.SettingsAPI />,
    value: 'api',
  },
  // Keep the delete wallet option at the bottom
  {
    component: <Settings.SettingsDelete />,
    value: 'delete',
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
