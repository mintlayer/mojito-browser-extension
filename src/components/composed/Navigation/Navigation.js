/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
import { ReactComponent as ExpandImg } from '@Assets/images/icon-expand.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/settings.svg'
import { ReactComponent as LoginImg } from '@Assets/images/icon-login.svg'
import { ReactComponent as AddWalletImg } from '@Assets/images/icon-add-wallet.svg'
import { ReactComponent as HomeImg } from '@Assets/images/icon-home.svg'
import { ReactComponent as WalletIcon } from '@Assets/images/icon-wallet.svg'
import { ReactComponent as TriangleIcon } from '@Assets/images/icon-triangle.svg'

import { APP_VERSION } from '@Version'

import { AccountContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'

import NestedNavigation from './NestedNavigation'

import './Navigation.css'

const Navigation = ({ customNavigation }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [navigationItemID, setNavigationItemID] = useState(null)
  const [nestedItemID, setNestedItemID] = useState(null)
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
    setSliderMenuOpen(!sliderMenuOpen)
  }

  const onNavigationItemClick = (item) => {
    if (item.type !== 'menu') {
      navigate(item.link)
      toggleSliderMenu()
    } else {
      setNavigationItemID(navigationItemID === item.id ? null : item.id)
    }
    return
  }

  const onNestedItemClick = (item) => {
    if (item.type !== 'menu') {
      navigate(item.link)
      toggleSliderMenu()
    } else {
      setNestedItemID(nestedItemID === item.id ? null : item.id)
    }
    return
  }

  const expandHandler = () => {
    window.open(
      typeof browser !== 'undefined'
        ? // eslint-disable-next-line no-undef
          browser.runtime.getURL('popup.html')
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

  const loggedNavigationList = [
    {
      id: 1,
      label: 'Dashboard',
      icon: <HomeImg />,
      link: '/dashboard',
    },
    {
      id: 2,
      label: 'Wallets',
      icon: <WalletIcon />,
      type: 'menu',
      content: AppInfo.WALLETS_NAVIGATION,
    },
    {
      id: 3,
      label: 'Settings',
      icon: <SettingsImg />,
      link: '/settings',
    },
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 4,
            label: 'Connection Page',
            icon: <SettingsImg />,
            link: '/connect',
          },
        ]
      : []),
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 5,
            label: 'Test Sign Transaction',
            icon: <SettingsImg />,
            link: '/wallet/Mintlayer/sign-external-transaction',
          },
        ]
      : []),
    ...(process.env.REACT_APP_CONFIG_NAME !== 'production'
      ? [
          {
            id: 6,
            label: 'Test Sign Challenge',
            icon: <SettingsImg />,
            link: '/wallet/Mintlayer/sign-challenge',
          },
        ]
      : []),
  ]

  const navigationList = [
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

  const navList = customNavigation
    ? customNavigation
    : unlocked
      ? loggedNavigationList
      : navigationList

  return (
    <>
      <ul>
        {navList.map((item) => (
          <li
            key={item.id}
            className={`navigation-item ${navigationItemID === item.id && 'navigation-item-open'}`}
          >
            <div
              className="label-wrapper"
              onClick={() => {
                onNavigationItemClick(item)
              }}
            >
              {item.icon && item.icon}
              {item.label}
            </div>

            {item.type === 'menu' && navigationItemID === item.id && (
              <NestedNavigation
                item={item}
                onNestedItemClick={onNestedItemClick}
                nestedItemID={nestedItemID}
              />
            )}
            {item.type === 'menu' && (
              <TriangleIcon
                className={`navigation-triangle ${navigationItemID === item.id && 'navigation-triangle-open'}`}
              />
            )}
          </li>
        ))}
      </ul>
      <ul className="slider-bottom-nav">
        {!isExtended && (
          <li
            className="bottom-menu-item"
            onClick={expandHandler}
            data-testid="navigation-expand-view"
          >
            <ExpandImg /> Expand view
          </li>
        )}
        {unlocked && (
          <li
            className="bottom-menu-item"
            onClick={logoutHandler}
            data-testid="navigation-logout"
          >
            <LogoutImg />
            Logout
          </li>
        )}
        <span className="slider-version">v{APP_VERSION}</span>
      </ul>
    </>
  )
}

export default Navigation
