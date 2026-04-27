import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'

import { Navigation } from '@ComposedComponents'

import { ReactComponent as LogoIcon } from '@Assets/images/logo.svg'
import { ReactComponent as CopyIcon } from '@Assets/images/icon-copy.svg'
import { ReactComponent as SuccessIcon } from '@Assets/images/icon-success.svg'

import { AccountContext } from '@Contexts'

import styles from './Sidebar.module.css'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #a8e6cf, #f9e79f, #f5b041)',
  'linear-gradient(135deg, #89CFF0, #B19CD9)',
  'linear-gradient(135deg, #f5af19, #f12711)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
]

const Sidebar = () => {
  const { accountName, addresses, isAccountUnlocked, accountID } =
    useContext(AccountContext)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const unlocked = isAccountUnlocked()

  if (!unlocked) return null

  const mlAddress =
    addresses.mlAddresses &&
    addresses.mlAddresses.mlReceivingAddresses &&
    addresses.mlAddresses.mlReceivingAddresses[0]

  const shortenAddress = (addr: string) => {
    if (!addr) return ''
    return addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-5)}` : addr
  }

  const handleCopy = () => {
    if (mlAddress) {
      navigator.clipboard.writeText(mlAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  const avatarGradient = accountID
    ? AVATAR_GRADIENTS[
        (typeof accountID === 'string' ? accountID.charCodeAt(0) : accountID) %
          AVATAR_GRADIENTS.length
      ]
    : AVATAR_GRADIENTS[0]

  return (
    <aside className={styles.sidebar}>
      <div className={styles.top}>
        <div className={styles.logoRow}>
          <LogoIcon className={styles.logoIcon} />
          <span className={styles.logoText}>Mojito</span>
        </div>

        {mlAddress && (
          <div className={styles.accountCard}>
            <div
              className={styles.avatar}
              style={{ background: avatarGradient }}
            />
            <div className={styles.accountInfo}>
              <span className={styles.accountName}>{accountName}</span>
              <span className={styles.accountAddress}>
                {shortenAddress(mlAddress)}
              </span>
            </div>
            <button
              className={styles.copyBtn}
              onClick={handleCopy}
            >
              {copied ? (
                <SuccessIcon className={styles.copyIcon} />
              ) : (
                <CopyIcon className={styles.copyIcon} />
              )}
            </button>
          </div>
        )}
      </div>

      <Navigation toggleMenu={false} />
    </aside>
  )
}

export default Sidebar
