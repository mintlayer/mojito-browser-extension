import { Settings } from '@ContainerComponents'
import { PageWrapper } from '@BasicComponents'
import styles from './Settings.module.css'

interface SettingsPageProps {
  unlocked?: boolean
}

const SettingsPage = ({ unlocked }: SettingsPageProps) => {
  const sections = [
    {
      title: 'Network',
      key: 'network',
      visible: true,
      items: [{ key: 'testnet', component: <Settings.SettingsTestnet /> }],
    },
    {
      title: 'Wallet',
      key: 'wallet',
      visible: unlocked,
      items: [
        { key: 'backup', component: <Settings.SettingsBackup /> },
        { key: 'delete', component: <Settings.SettingsDelete /> },
      ],
    },
    {
      title: 'Connections',
      key: 'connections',
      visible: true,
      content: <Settings.SettingsConnections />,
    },
    {
      title: 'About',
      key: 'about',
      visible: true,
      content: <Settings.SettingsAbout />,
    },
  ]

  return (
    <PageWrapper>
      <div className={styles.wrapper}>
        {sections.map((section) =>
          section.visible ? (
            <Settings.SettingsSection
              key={section.key}
              title={section.title}
            >
              {section.content ||
                section.items?.map((item) => (
                  <Settings.SettingsSection.Item key={item.key}>
                    {item.component}
                  </Settings.SettingsSection.Item>
                ))}
            </Settings.SettingsSection>
          ) : null,
        )}
      </div>
    </PageWrapper>
  )
}

export default SettingsPage
