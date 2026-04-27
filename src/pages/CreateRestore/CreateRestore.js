import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { Button, PageWrapper } from '@BasicComponents'
import { ReactComponent as LogoIcon } from '@Assets/images/logo.svg'
import { ReactComponent as ShieldIcon } from '@Assets/images/icon-shield.svg'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'
import { AccountContext } from '@Contexts'
import { LocalStorageService } from '@Storage'

import styles from './CreateRestore.module.css'

const CreateRestorePage = () => {
  const { isExtended } = useContext(AccountContext)
  const navigate = useNavigate()
  const devLocations = [':300', ':800']
  const isDevMode = devLocations.some((location) =>
    window.location.href.includes(location),
  )

  const expandHandler = (dest) => {
    window.open(
      typeof browser !== 'undefined'
        ? // eslint-disable-next-line no-undef
          browser.runtime.getURL('popup.html')
        : // eslint-disable-next-line no-undef
          chrome.runtime.getURL('popup.html'),
      '_blank',
      LocalStorageService.setItem('extendPath', dest),
    )
  }

  const goToSetAccountPage = () => {
    if (isDevMode) {
      return navigate('/set-account')
    }
    isExtended ? navigate('/set-account') : expandHandler('/set-account')
  }

  const goToRestoreAccountPage = () => {
    if (isDevMode) {
      return navigate('/restore-account')
    }
    isExtended
      ? navigate('/restore-account')
      : expandHandler('/restore-account')
  }

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div
        data-testid="create-restore"
        className={styles.page}
      >
        <LogoIcon className={styles.logoIcon} />
        <h1 className={styles.title}>Mojito</h1>
        <h2 className={styles.heading}>A fresh way to hold Mintlayer assets</h2>
        <p className={styles.subtitle}>
          Self-custody wallet for Bitcoin and Mintlayer tokens.
          <br />
          Live prices, fast swaps, no custodians.
        </p>
        <div className={styles.buttons}>
          <Button
            onClickHandle={goToSetAccountPage}
            extraStyleClasses={[styles.createButton]}
          >
            Create a new wallet{' '}
            <IconArrowTopRight className={styles.buttonIcon} />
          </Button>
          <Button
            alternate
            onClickHandle={goToRestoreAccountPage}
            extraStyleClasses={[styles.restoreButton]}
          >
            Import existing wallet{' '}
            <IconArrowTopRight className={styles.buttonIcon} />
          </Button>
        </div>
        <div className={styles.badges}>
          <span className={styles.badgeWithIcon}>
            <ShieldIcon className={styles.badgeIcon} />
            Non-custodial
          </span>
          <span className={styles.badgeDot}>&middot;</span>
          <span>Audited</span>
          <span className={styles.badgeDot}>&middot;</span>
          <span>Open source</span>
        </div>
      </div>
    </PageWrapper>
  )
}

export default CreateRestorePage
