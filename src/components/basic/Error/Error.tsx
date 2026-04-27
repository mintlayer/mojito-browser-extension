import { useState, useEffect, useRef } from 'react'

import styles from './Error.module.css'

interface ErrorProps {
  error: string | string[] | null
}

const Error = ({ error }: ErrorProps) => {
  const [visible, setVisible] = useState(!!error)
  const [hiding, setHiding] = useState(false)
  const lastError = useRef(error)

  useEffect(() => {
    if (error) {
      lastError.current = error
      setHiding(false)
      setVisible(true)
    } else if (visible) {
      setHiding(true)
    }
  }, [error])

  const handleAnimationEnd = () => {
    if (hiding) {
      setVisible(false)
      setHiding(false)
    }
  }

  if (!visible) return null

  const displayError = error || lastError.current

  const className = [styles.errorMessage, hiding && styles.errorMessageHiding]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      data-testid="error"
      onAnimationEnd={handleAnimationEnd}
    >
      {Array.isArray(displayError) ? (
        displayError.map((message) => (
          <p
            key={message.trim()}
            data-testid="error-message"
          >
            {message}
          </p>
        ))
      ) : (
        <p
          key={displayError?.trim()}
          data-testid="error-message"
        >
          {displayError}
        </p>
      )}
    </div>
  )
}

export default Error
