import { useEffect, useRef, useState } from 'react'

import { ReactComponent as CopyIcon } from '@Assets/images/icon-copy.svg'
import { ReactComponent as SuccessIcon } from '@Assets/images/icon-success.svg'

import styles from './CopyButton.module.css'

const COPY_FEEDBACK_MS = 1200

const CopyButton = ({ content }) => {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(timerRef.current)
    },
    [],
  )

  const handleCopy = () => {
    if (!content) return

    navigator.clipboard
      .writeText(content)
      .then(() => {
        clearTimeout(timerRef.current)
        setCopied(true)
        timerRef.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
      })
      .catch(() => {
        // clipboard can be denied (unfocused document, permissions) — never
        // show a false "copied" confirmation
      })
  }

  return (
    <button
      className={styles.copyButton}
      onClick={handleCopy}
      type="button"
      data-testid="copy-btn"
      aria-label="Copy to clipboard"
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
