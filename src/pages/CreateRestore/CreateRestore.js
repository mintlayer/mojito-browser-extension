import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { Button, MojitoLogo, PageWrapper } from '@BasicComponents'
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
    navigate('/restore-account')
  }

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div
        data-testid="create-restore"
        className={styles.page}
      >
        <div className={styles.center}>
          <div className={styles.logo}>
            <MojitoLogo size={88} />
          </div>
          <h1 className={styles.title}>Mojito</h1>
          <p className={styles.subtitle}>
            Self-custody wallet for Bitcoin and Mintlayer.
            <br />
            Your keys never leave this browser.
          </p>
          <div className={styles.chips}>
            <span className={`${styles.chip} ${styles.chipAmber}`}>
              <span className={styles.dot} />
              Bitcoin
            </span>
            <span className={`${styles.chip} ${styles.chipTeal}`}>
              <span className={styles.dot} />
              Mintlayer
            </span>
          </div>
        </div>
        <div className={styles.buttons}>
          <Button
            onClickHandle={goToSetAccountPage}
            extraStyleClasses={[styles.primaryButton]}
          >
            Create a new wallet
          </Button>
          <Button
            onClickHandle={goToRestoreAccountPage}
            extraStyleClasses={[styles.secondaryButton]}
          >
            I already have a recovery phrase
          </Button>
          <p className={styles.terms}>
            By continuing you agree to the <a href="#terms">Terms</a> and{' '}
            <a href="#privacy">Privacy policy</a>.
          </p>
        </div>
      </div>
    </PageWrapper>
  )
}

export default CreateRestorePage
