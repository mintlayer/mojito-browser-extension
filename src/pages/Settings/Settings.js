import { Settings } from '@ContainerComponents'

import './Settings.css'

const SettingsPage = ({unlocked}) => {
  const SettingsList = [
    {
      component: <Settings.SettingsTestnet />,
      value: 'testnet',
      visible: true,
    },
    {
      component: <Settings.SettingsAPI />,
      value: 'api',
      visible: true,
    },
    // Keep the delete wallet option at the bottom
    {
      component: <Settings.SettingsDelete />,
      value: 'delete',
      visible: unlocked,
    },
  ]
  return (
    <>
      <ul className="settingsWrapper">
        {SettingsList.map((item) => (
          <>
            {item.visible && (
              <li
                className="settingsItem"
                key={item.value}
              >
                {item.component}
                <div className="divider" />
              </li>
            )}
          </>
        ))}
      </ul>
    </>
  )
}

export default SettingsPage
