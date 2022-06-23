import React from 'react'
import Button from '../basic/button'
import { useNavigate, useLocation } from 'react-router-dom'
import { ReactComponent as BackImg } from '../../assets/img/back-button.svg'
import Logo from '../../assets/img/logo96.png'

import './header.css'

const Header = ({ customBackAction, noBackButton = false }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const goBack = () => (customBackAction ? customBackAction() : navigate(-1))
  const isHome = () => !customBackAction && location.pathname === '/'

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
