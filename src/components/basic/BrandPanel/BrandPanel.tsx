import { ReactComponent as LogoIcon } from '@Assets/images/logo.svg'
import { ReactComponent as BackgroundHome } from '@Assets/images/background-home.svg'
import '@Assets/images/background-home.css'

import styles from './BrandPanel.module.css'

const BrandPanel = () => {
  return (
    <div className={styles.brandPanel}>
      <BackgroundHome className={styles.brandBg} />
      <div className={styles.brandContent}>
        <LogoIcon className={styles.brandLogo} />
        <div className={styles.brandTitle}>
          <span>Mojito</span>
        </div>
        <p className={styles.brandSubtitle}>
          Your non-custodial
          <br />
          Mintlayer wallet
        </p>
      </div>
    </div>
  )
}

export default BrandPanel
