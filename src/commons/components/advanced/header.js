import React from 'react'
import Button from '../basic/button'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as BackImg } from '../../assets/img/back-button.svg'

import './header.css'

const Header = () => {
  const navigate = useNavigate()

  const goBack = () => navigate(-1)

  return (
    <header
      data-testid="header-container">
      <Button
        alternate
        extraStyleClasses={['backButton']}
        onClickHandle={goBack}>
        <BackImg />
      </Button>
    </header>
  )
}

export default Header
