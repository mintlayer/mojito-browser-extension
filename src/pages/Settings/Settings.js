import { Settings } from '@ContainerComponents'

import './Settings.css'

const SettingsPage = ({ unlocked }) => {
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
    {
      component: <Settings.SettingsBackup />,
      value: 'backup',
      visible: unlocked,
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
      <ul className="settings-wrapper">
        {SettingsList.map((item) => (
          <>
            {item.visible && (
              <li
                className="settings-item"
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
