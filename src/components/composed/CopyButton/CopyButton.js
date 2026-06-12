import { useState } from 'react'

import { ReactComponent as CopyIcon } from '@Assets/images/icon-copy.svg'
import { ReactComponent as SuccessIcon } from '@Assets/images/icon-success.svg'

import styles from './CopyButton.module.css'

const CopyButton = ({ content }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    }
  }

  return (
    <button
      className={styles.copyButton}
      onClick={handleCopy}
      type="button"
      data-testid="copy-btn"
    >
      {copied ? (
        <SuccessIcon data-testid="success-icon" />
      ) : (
        <CopyIcon data-testid="copy-icon" />
      )}
    </button>
  )
}

export default CopyButton
