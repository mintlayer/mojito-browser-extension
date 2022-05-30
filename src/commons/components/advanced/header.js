import React from 'react'
import Button from '../basic/button'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as BackImg } from '../../assets/img/back-button.svg'
import Logo from '../../assets/img/logo96.png'

import './header.css'

const Header = () => {
  const navigate = useNavigate()

  const goBack = () => navigate(-1)

  return (
    <header data-testid="header-container">
      <Button
        alternate
        extraStyleClasses={['backButton']}
        onClickHandle={goBack}
      >
        <BackImg />
      </Button>
      <div className="logoContainer">
        <img src={Logo} alt="Mojito Logo" className="logo" />
        <h1 className="mojitoLettering">Mojito</h1>
      </div>
    </header>
  )
}

export default Header
