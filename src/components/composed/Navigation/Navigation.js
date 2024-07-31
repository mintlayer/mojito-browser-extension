/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
import { ReactComponent as ExpandImg } from '@Assets/images/icon-expand.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/settings.svg'
import { ReactComponent as LoginImg } from '@Assets/images/icon-login.svg'
import { ReactComponent as AddWalletImg } from '@Assets/images/icon-add-wallet.svg'
import { ReactComponent as HomeImg } from '@Assets/images/icon-home.svg'


import { AccountContext } from '@Contexts'

import './Navigation.css'

const Navigation = ({ customNavigation }) => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAccountUnlocked,
    logout,
    isExtended,
    sliderMenuOpen,
    setSliderMenuOpen,
  } = useContext(AccountContext)

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

   const toggleSliderMenu = () => {
     setSliderMenuOpen(!sliderMenuOpen)
   }

  const goSettings = () => {
    navigate('/settings')
    toggleSliderMenu()
  }

  const goDashboard = () => {
    navigate('/dashboard')
    toggleSliderMenu()
  }

  const goLogin = () => {
    navigate('/')
    toggleSliderMenu()
  }

  const goCreateAccount = () => {
    navigate('/create-restore')
    toggleSliderMenu()
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
    logout()
    navigate('/')
    toggleSliderMenu()
  }

  const loggedNavigationList = [
    {
      id: 1,
      label: 'Dashboard',
      icon: <HomeImg />,
      onClick: goDashboard,
    },
    {
      id: 2,
      label: 'Settings',
      icon: <SettingsImg />,
      onClick: goSettings,
    },
  ]

  const navigationList = [
    {
      id: 1,
      label: 'Login',
      icon: <LoginImg />,
      onClick: goLogin,
    },
    {
      id: 2,
      label: 'Create/Restore Wallet',
      icon: <AddWalletImg />,
      onClick: goCreateAccount,
    },
    {
      id: 3,
      label: 'Settings',
      icon: <SettingsImg />,
      onClick: goSettings,
    },
  ]

  const navList = customNavigation ? customNavigation : unlocked ? loggedNavigationList : navigationList

  return (
    <>
      <ul>
        {navList.map((item) => (
          <li
            key={item.id}
            onClick={item.onClick}
            className="bottom-menu-item"
          >
            {item.icon && item.icon}
            {item.label}
          </li>
        ))}
      </ul>
      <ul className="slider-bottom-nav">
        {!isExtended && (
          <li
            className="bottom-menu-item"
            onClick={expandHandler}
          >
            <ExpandImg /> Expand view
          </li>
        )}
        {unlocked && (
          <li
            className="bottom-menu-item"
            onClick={logoutHandler}
          >
            <LogoutImg />
            Logout
          </li>
        )}
        <span className='slider-version'>v1.2.9</span>
      </ul>
    </>
  )
}

export default Navigation
