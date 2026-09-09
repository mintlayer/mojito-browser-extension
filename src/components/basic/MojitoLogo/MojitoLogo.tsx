import { ReactComponent as MintlayerLogoSvg } from '@Assets/images/logo.svg'
import styles from './MojitoLogo.module.css'

interface MojitoLogoProps {
  size?: number
  animate?: boolean
}

// Onboarding shows the real Mintlayer mark (assets/logo.svg), not a custom
// glyph. The orbit ring stays available as a subtle touch on welcome screens.
const MojitoLogo = ({ size = 48, animate = true }: MojitoLogoProps) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MintlayerLogoSvg
        width={size}
        height={size}
        data-testid="mojito-logo"
      />
      {animate && <div className={styles.orbit} />}
    </div>
  )
}

export default MojitoLogo
