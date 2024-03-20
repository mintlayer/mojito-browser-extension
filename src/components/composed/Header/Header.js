import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as BackImg } from '@Assets/images/back-button.svg'
import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
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

      {unlocked && (
        <>
          <Button
            alternate
            extraStyleClasses={['settings']}
            onClickHandle={goSettings}
          >
            <SettingsImg />
          </Button>
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
