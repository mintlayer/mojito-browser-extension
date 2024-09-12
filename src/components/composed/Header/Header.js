/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as BackImg } from '@Assets/images/back-button.svg'
import { ReactComponent as MenuImg } from '@Assets/images/icon-hamburger.svg'

import { Button, Logo } from '@BasicComponents'
import { UpdateButton, SliderMenu, Navigation } from '@ComposedComponents'
import { AccountContext } from '@Contexts'

import './Header.css'

const Header = ({ customBackAction }) => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAccountUnlocked,
    sliderMenuOpen,
    setSliderMenuOpen,
  } = useContext(AccountContext)

  const coinType = location.pathname.includes('/wallet/')
    ? location.pathname.split('/wallet/')[1].split('/')[0]
    : ''

  const isWalletPage = location.pathname === '/wallet/' + coinType
  const isSettingsPage = location.pathname === '/settings'
  const isStakingPage = location.pathname === '/wallet/' + coinType + '/staking'

  const noBackButtonPages = ['/dashboard', '/']
  const noBackButton = noBackButtonPages.includes(location.pathname)

  const hideWithoutCustomBack = ['/set-account', '/restore-account']

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  if (hideWithoutCustomBack.includes(location.pathname) && !customBackAction) {
    return null
  }

  const goBack = () => {
    if (isWalletPage) {
      navigate('/dashboard')
      return
    }
    if (isSettingsPage) {
      navigate('/')
      return
    }
    if (isStakingPage) {
      navigate('/wallet/' + coinType)
      return
    }
    return customBackAction ? customBackAction() : navigate(-1)
  }

  const toggleSliderMenu = () => {
    setSliderMenuOpen(!sliderMenuOpen)
  }

  return (
    <header data-testid="header-container">
      <div style={{ visibility: !noBackButton ? 'visible' : 'hidden' }}>
        <Button
          alternate
          extraStyleClasses={['backButton']}
          onClickHandle={goBack}
        >
          <BackImg />
        </Button>
      </div>

          <div className="expand-wrapped">
            <Button
              alternate
              extraStyleClasses={['header-menu-button']}
              onClickHandle={toggleSliderMenu}
            >
              <MenuImg />
            </Button>
          </div>
      <Logo />
      {unlocked && <UpdateButton />}
      <SliderMenu
        isOpen={sliderMenuOpen}
        onClose={toggleSliderMenu}
      >
        <Navigation />
      </SliderMenu>
    </header>
  )
}

export default Header
