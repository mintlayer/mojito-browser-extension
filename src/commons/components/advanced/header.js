import React, { useContext } from 'react'
import Button from '../basic/button'
import { useNavigate } from 'react-router-dom'
import { ReactComponent as BackImg } from '../../assets/img/back-button.svg'
import { ReactComponent as LogoutImg } from '../../assets/img/logout.svg'
import Logo from '../../assets/img/logo96.png'
import { Context } from '../../../ContextProvider'

import './header.css'

const Header = ({ customBackAction, noBackButton = false }) => {
  const navigate = useNavigate()
  const { isAccountUnlocked, logout } = useContext(Context)

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
