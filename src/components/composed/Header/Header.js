/* eslint-disable no-undef */
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import { ReactComponent as BackImg } from '@Assets/images/back-button.svg'
import { ReactComponent as LogoutImg } from '@Assets/images/logout.svg'
import { ReactComponent as ExpandImg } from '@Assets/images/icon-expand.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/settings.svg'

import { Button, Logo, Tooltip } from '@BasicComponents'
import { UpdateButton } from '@ComposedComponents'
import { AccountContext } from '@Contexts'

import './Header.css'

const Header = ({ customBackAction }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const tooltipMessage = 'Expand view'
  const navigate = useNavigate()
  const location = useLocation()
  const { isAccountUnlocked, logout, isExtended } = useContext(AccountContext)

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
          browser.runtime.getURL('popup.html')
        : chrome.runtime.getURL('popup.html'),
      '_blank',
    )
  }

  const toggleTooltip = () => {
    setTooltipVisible(!tooltipVisible)
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

      {!unlocked && !isExtended && (
        <div className="expand-wrapped">
          <div className="tooltipWrapper">
            <Button
              alternate
              extraStyleClasses={['settings']}
              onClickHandle={expandHandler}
              onMouseEnter={toggleTooltip}
              onMouseLeave={toggleTooltip}
            >
              <ExpandImg />
            </Button>
            <Tooltip
              message={tooltipMessage}
              visible={tooltipVisible}
              position="left"
            />
          </div>
        </div>
      )}

      {unlocked && (
        <>
          <div className="expand-wrapped expand-wrapped-unlocked">
            {!isExtended && (
              <div className="tooltipWrapper">
                <Button
                  alternate
                  extraStyleClasses={['expand']}
                  onClickHandle={expandHandler}
                  onMouseEnter={toggleTooltip}
                  onMouseLeave={toggleTooltip}
                >
                  <ExpandImg />
                </Button>
                <Tooltip
                  message={tooltipMessage}
                  visible={tooltipVisible}
                  position="left"
                />
              </div>
            )}
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
      <Logo unlocked={unlocked} />
      {unlocked && <UpdateButton />}
    </header>
  )
}

export default Header
