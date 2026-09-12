/* eslint-disable no-undef */
import { ReactNode, useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { ReactComponent as LogoutImg } from '@Assets/images/icon-logout.svg'
import { ReactComponent as ExpandImg } from '@Assets/images/icon-expand.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/icon-settings.svg'
import { ReactComponent as LoginImg } from '@Assets/images/icon-login.svg'
import { ReactComponent as AddWalletImg } from '@Assets/images/icon-add-wallet.svg'
import { ReactComponent as HomeImg } from '@Assets/images/icon-home.svg'

import { APP_VERSION } from '@Version'

import { AccountContext, MintlayerContext } from '@Contexts'

import styles from './Navigation.module.css'

interface NavigationItem {
  id: number
  label: string
  icon?: ReactNode
  link?: string
  type?: string
  content?: NavigationItem[]
}

interface NavigationProps {
  toggleMenu?: boolean
}

const Navigation = ({ toggleMenu = true }: NavigationProps) => {
  const [unlocked, setUnlocked] = useState(false)
  const [navigationItemID, setNavigationItemID] = useState<number | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAccountUnlocked,
    logout,
    isExtended,
    sliderMenuOpen,
    setSliderMenuOpen,
  } = useContext(AccountContext)
  const { setAllDataFetching } = useContext(MintlayerContext)

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const toggleSliderMenu = () => {
    if (!toggleMenu) return
    setSliderMenuOpen(!sliderMenuOpen)
  }

  const onNavigationItemClick = (item: NavigationItem) => {
    if (item.type !== 'menu') {
      navigate(item.link!)
      toggleSliderMenu()
    } else {
      setNavigationItemID(navigationItemID === item.id ? null : item.id)
    }
  }

  const expandHandler = () => {
    window.open(
      typeof browser !== 'undefined'
        ? browser.runtime.getURL('popup.html')
        : chrome.runtime.getURL('popup.html'),
      '_blank',
    )
  }

  const logoutHandler = () => {
    setAllDataFetching(false)
    logout()
    navigate('/')
    toggleSliderMenu()
  }

  const loggedNavigationList: NavigationItem[] = [
    {
      id: 1,
      label: 'Dashboard',
      icon: <HomeImg />,
      link: '/dashboard',
    },

    {
      id: 4,
      label: 'Settings',
      icon: <SettingsImg />,
      link: '/settings',
    },
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 5,
            label: 'Connection Page',
            icon: <SettingsImg />,
            link: '/connect',
          },
        ]
      : []),
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 6,
            label: 'Test Sign Transaction',
            icon: <SettingsImg />,
            link: '/wallet/Mintlayer/sign-external-transaction',
          },
        ]
      : []),
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 7,
            label: 'Test Sign Bitcoin Transaction',
            icon: <SettingsImg />,
            link: '/wallet/Bitcoin/sign-transaction',
          },
        ]
      : []),
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 8,
            label: 'Test Sign Challenge',
            icon: <SettingsImg />,
            link: '/wallet/Mintlayer/sign-challenge',
          },
        ]
      : []),
  ]

  const navigationList: NavigationItem[] = [
    {
      id: 1,
      label: 'Login',
      icon: <LoginImg />,
      link: '/',
      type: 'link',
    },
    {
      id: 2,
      label: 'Create/Restore Wallet',
      icon: <AddWalletImg />,
      link: '/create-restore',
      type: 'link',
    },
    {
      id: 3,
      label: 'Settings',
      icon: <SettingsImg />,
      link: '/settings',
      type: 'link',
    },
  ]

  const isActive = (item: NavigationItem) => {
    if (!item.link) return false
    return location.pathname.startsWith(item.link)
  }

  const navList = unlocked ? loggedNavigationList : navigationList

  return (
    <>
      <ul className={styles.navigationList}>
        {navList.map((item) => (
          <li
            key={item.id}
            className={`${styles.navigationItem} ${navigationItemID === item.id && styles.navigationItemOpen} ${isActive(item) && styles.navigationItemActive}`}
            onClick={() => {
              onNavigationItemClick(item)
            }}
          >
            <div className={styles.labelWrapper}>
              {item.icon && item.icon}
              {item.label}
            </div>
          </li>
        ))}
      </ul>
      <ul className={styles.sliderBottomNav}>
        {!isExtended && (
          <li
            className={styles.bottomMenuItem}
            onClick={expandHandler}
            data-testid="navigation-expand-view"
          >
            <div className={styles.labelWrapper}>
              <ExpandImg /> Expand view
            </div>
          </li>
        )}
        {unlocked && (
          <li
            className={styles.bottomMenuItem}
            onClick={logoutHandler}
            data-testid="navigation-logout"
          >
            <div className={styles.labelWrapper}>
              <LogoutImg />
              Logout
            </div>
          </li>
        )}
        <span className={styles.sliderVersion}>v{APP_VERSION}</span>
      </ul>
    </>
  )
}

export default Navigation
