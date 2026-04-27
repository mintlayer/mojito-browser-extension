import { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { ReactComponent as BackImg } from '@Assets/images/icon-arrow-left.svg'
import { ReactComponent as MenuImg } from '@Assets/images/icon-hamburger.svg'
import { ReactComponent as SettingsImg } from '@Assets/images/icon-settings.svg'

import { Button, Logo } from '@BasicComponents'
import { UpdateButton, SliderMenu, Navigation } from '@ComposedComponents'
import { AccountContext } from '@Contexts'

import styles from './Header.module.css'

const Header = () => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    isAccountUnlocked,
    sliderMenuOpen,
    setSliderMenuOpen,
    customBackAction,
  } = useContext(AccountContext)

  const coinType = location.pathname.includes('/wallet/')
    ? location.pathname.split('/wallet/')[1].split('/')[0]
    : ''

  const isWalletPage = location.pathname === '/wallet/' + coinType
  const isSettingsPage = location.pathname === '/settings'
  const isStakingPage = location.pathname === '/wallet/' + coinType + '/staking'

  const noBackButtonPages = ['/dashboard', '/']
  const noBackButton = noBackButtonPages.includes(location.pathname)
  const isCreateRestorePage = location.pathname === '/create-restore'

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const goBack = () => {
    if (isWalletPage) {
      navigate('/dashboard')
      return
    }
    if (isSettingsPage) {
      navigate(unlocked ? '/dashboard' : '/')
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
    <header
      className={styles.header}
      data-testid="header-container"
    >
      <div style={{ visibility: !noBackButton ? 'visible' : 'hidden' }}>
        <Button
          extraStyleClasses={[styles.backButton]}
          onClickHandle={goBack}
        >
          <BackImg />
        </Button>
      </div>

      <div className={styles.expandWrapped}>
        <Button
          extraStyleClasses={[styles.menuButton]}
          onClickHandle={toggleSliderMenu}
        >
          <MenuImg />
        </Button>
      </div>
      {!isCreateRestorePage && (
        <div className={styles.logoWrapper}>
          <Logo />
          {unlocked && <UpdateButton />}
        </div>
      )}

      {!unlocked && (
        <div className={styles.settingsExpand}>
          <Button
            extraStyleClasses={[styles.settingsButton]}
            onClickHandle={() => navigate('/settings')}
          >
            <SettingsImg />
          </Button>
        </div>
      )}

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
