import { useState, cloneElement, ReactElement } from 'react'
import styles from './TokenIcon.module.css'
import { ReactComponent as MlLogo } from '@Assets/images/logo.svg'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'

interface TokenIconProps {
  symbol: string
  size?: number
  // Token metadata icon (token_info.icon_uri.string). ipfs:// is mapped to a
  // public gateway; anything unreachable falls back to the generated tile.
  iconUri?: string
}

const MAP: Record<string, { c1: string; c2: string; g: string }> = {
  ETH: { c1: 'oklch(0.74 0.06 280)', c2: 'oklch(0.55 0.08 280)', g: 'Ξ' },
  USDT: { c1: 'oklch(0.78 0.13 160)', c2: 'oklch(0.6 0.12 160)', g: '₮' },
  USDC: { c1: 'oklch(0.7 0.13 240)', c2: 'oklch(0.55 0.14 250)', g: '$' },
}

const GRADIENTS: Record<string, { c1: string; c2: string }> = {
  BTC: { c1: 'oklch(0.82 0.16 70)', c2: 'oklch(0.7 0.17 50)' },
  ML: { c1: 'oklch(0.36 0.015 70)', c2: 'oklch(0.26 0.015 70)' },
}

const LOGOS: Record<string, ReactElement> = {
  BTC: <BtcLogo />,
  ML: <MlLogo />,
}

const toRenderableUri = (uri: string) =>
  uri.startsWith('ipfs://')
    ? uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
    : uri

// If the resolved icon URL times out on a gateway, the img onError cycles
// through the remaining mirrors before giving up entirely.
const IMG_GATEWAY_FALLBACKS: Array<[string, string]> = [
  ['https://ipfs.io/ipfs/', 'https://dweb.link/ipfs/'],
  ['https://dweb.link/ipfs/', 'https://w3s.link/ipfs/'],
]

// Native BTC/ML assets get the real chain logos; tokens show their metadata
// icon when available, otherwise the procedural design-system tile (unknown
// symbols fall back to first letter).
const TokenIcon = ({ symbol, size = 36, iconUri }: TokenIconProps) => {
  const [iconFailed, setIconFailed] = useState(false)
  const [iconSrc, setIconSrc] = useState<string | undefined>(
    iconUri ? toRenderableUri(iconUri) : undefined,
  )
  const logo = LOGOS[symbol]
  const { c1, c2 } = GRADIENTS[symbol] ?? {
    c1: 'oklch(0.6 0.05 60)',
    c2: 'oklch(0.4 0.05 60)',
  }

  // Keep the displayed src in sync when the resolved icon arrives late.
  const [lastIconUri, setLastIconUri] = useState(iconUri)
  if (iconUri !== lastIconUri) {
    setLastIconUri(iconUri)
    setIconSrc(iconUri ? toRenderableUri(iconUri) : undefined)
    setIconFailed(false)
  }

  const showImage = Boolean(iconSrc) && !iconFailed && !logo

  const handleIconError = () => {
    if (!iconSrc) {
      setIconFailed(true)
      return
    }
    const fallback = IMG_GATEWAY_FALLBACKS.find(([from]) =>
      iconSrc.startsWith(from),
    )
    if (fallback) {
      setIconSrc(iconSrc.replace(fallback[0], fallback[1]))
    } else {
      setIconFailed(true)
    }
  }

  return (
    <div
      className={styles.token}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        boxShadow: `0 4px 14px -4px ${c1}, inset 0 1px 0 oklch(1 0 0 / 0.3)`,
      }}
      data-testid="token-icon"
    >
      {showImage ? (
        <img
          className={styles.tokenImage}
          src={iconSrc}
          alt={symbol}
          width={size}
          height={size}
          onError={handleIconError}
          data-testid="token-icon-image"
        />
      ) : logo ? (
        cloneElement(logo, {
          width: size * 0.62,
          height: size * 0.62,
        })
      ) : (
        (MAP[symbol]?.g ?? symbol[0])
      )}
    </div>
  )
}

export default TokenIcon
