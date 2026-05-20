import { useState } from 'react'

import styles from './Error.module.css'

interface ErrorProps {
  error: string | string[] | null
}

const Error = ({ error }: ErrorProps) => {
  const [hiding, setHiding] = useState(false)
  const [lastError, setLastError] = useState(error)
  const [prevError, setPrevError] = useState(error)

  if (error !== prevError) {
    setPrevError(error)
    if (error) {
      setLastError(error)
      setHiding(false)
    } else {
      setHiding(true)
    }
  }

  const handleAnimationEnd = () => {
    if (hiding) {
      setHiding(false)
    }
  }

  if (!error && !hiding) return null

  const displayError = error || lastError

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
