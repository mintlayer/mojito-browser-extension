import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as BackImg } from '../../../assets/images/back-button.svg'
import { ReactComponent as LogoutImg } from '../../../assets/images/logout.svg'
import Logo from '../../../assets/images/logo96.png'

import Button from '../../basic/Button/Button'

import { AccountContext } from '../../../contexts/AccountProvider/AccountProvider'

import './Header.css'

const Header = ({ customBackAction, noBackButton = false }) => {
  const navigate = useNavigate()
  const { isAccountUnlocked, logout } = useContext(AccountContext)

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
      {isAccountUnlocked() && (
        <Button
          alternate
          extraStyleClasses={['logout']}
          onClickHandle={logoutHandle}
        >
          <LogoutImg />
        </Button>
      )}

      {!noBackButton && (
        <Button
          alternate
          extraStyleClasses={['backButton']}
          onClickHandle={goBack}
        >
          <BackImg />
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
