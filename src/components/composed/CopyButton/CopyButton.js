import React, { useState } from 'react'
import { Button } from '@BasicComponents'

import { ReactComponent as CopyIcon } from '@Assets/images/icon-copy.svg'
import { ReactComponent as SuccessIcon } from '@Assets/images/icon-success.svg'

import './CopyButton.css'

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
    <Button
      type="button"
      extraStyleClasses={['copy-btn']}
      onClickHandle={handleCopy}
      title="Copy"
      dataTestId="copy-btn"
    >
      {copied ? (
        <SuccessIcon
          className="copy-icon"
          data-testid="success-icon"
        />
      ) : (
        <CopyIcon
          className="copy-icon"
          data-testid="copy-icon"
        />
      )}
    </Button>
  )
}

export default CopyButton
