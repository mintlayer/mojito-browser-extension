/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as BackImg } from '@Assets/images/back-button.svg'
import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
import { ReactComponent as ExpandImg } from '@Assets/images/icon-expand.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/settings.svg'

import { Button, Logo } from '@BasicComponents'
import { AccountContext } from '@Contexts'

import './Header.css'

const Header = ({ customBackAction, noBackButton = false }) => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAccountUnlocked, logout } = useContext(AccountContext)
  const isWalletPage = location.pathname === '/wallet'

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goBack = () => {
    if (isWalletPage) {
      navigate('/')
      return
    }
    return customBackAction ? customBackAction() : navigate(-1)
  }

  const logoutHandle = () => {
    logout()
    navigate('/')
  }

  const goSettings = () => {
    navigate('/settings')
  }

  const expandHandler = () => {
    window.open(
      typeof browser !== 'undefined'
        ? // eslint-disable-next-line no-undef
          browser.runtime.getURL('index.html')
        : chrome.runtime.getURL('index.html'),
      '_blank',
    )
  }

  return (
    <header data-testid="header-container">
      {!noBackButton && (
        <Button
          alternate
          extraStyleClasses={['backButton']}
          onClickHandle={goBack}
        >
          <BackImg />
        </Button>
      )}

      {!unlocked && (
        <div className="expand-wrapped">
          <Button
            alternate
            extraStyleClasses={['settings']}
            onClickHandle={expandHandler}
          >
            <ExpandImg />
          </Button>
        </div>
      )}

      {unlocked && (
        <>
          <div className="expand-wrapped expand-wrapped-unlocked">
            <Button
              alternate
              extraStyleClasses={['settings']}
              onClickHandle={expandHandler}
            >
              <ExpandImg />
            </Button>
            <Button
              alternate
              extraStyleClasses={['settings']}
              onClickHandle={goSettings}
            >
              <SettingsImg />
            </Button>
          </div>
          <Button
            alternate
            extraStyleClasses={['logout']}
            onClickHandle={logoutHandle}
          >
            <LogoutImg />
          </Button>
        </>
      )}
      <Logo />
    </header>
  )
}

export default Header
