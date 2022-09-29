import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as BackImg } from '@Assets/images/back-button.svg'
import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
import Logo from '@Assets/images/logo96.png'

import { Button } from '@BasicComponents'
import { AccountContext } from '@Contexts'

import './Header.css'

const Header = ({ customBackAction, noBackButton = false }) => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const { isAccountUnlocked, logout } = useContext(AccountContext)

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
  }, [isAccountUnlocked])

  const goBack = () => (customBackAction ? customBackAction() : navigate(-1))

  const logoutHandle = () => {
    logout()
    navigate('/')
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
        <Button
          alternate
          extraStyleClasses={['logout']}
          onClickHandle={logoutHandle}
        >
          <LogoutImg />
        </Button>
      )}

      <div className="logoContainer">
        <img
          src={Logo}
          alt="Mojito Logo"
          className="logo"
        />
        <h1 className="mojitoLettering">Mojito</h1>
      </div>
    </header>
  )
}

export default Header
