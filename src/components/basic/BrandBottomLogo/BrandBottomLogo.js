import { ReactComponent as LogoIcon } from '@Assets/images/logo.svg'

import styles from './BrandBottomLogo.module.css'

const BrandBottomLogo = () => {
  return (
    <div
      className={styles.brandBottomLogo}
      data-testid="brand-bottom-logo"
      aria-hidden="true"
    >
      <LogoIcon className={styles.logo} />
    </div>
  )
}

export default BrandBottomLogo
