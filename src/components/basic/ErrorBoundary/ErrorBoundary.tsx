import { Component, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

// Catches render errors and shows a recovery screen instead of a blank page.
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('[Mojito] UI error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className={styles.fallback}
          data-testid="error-boundary"
        >
          <div className={styles.box}>
            <h2 className={styles.title}>Something went wrong</h2>
            <p className={styles.text}>
              The wallet hit an unexpected error. Your funds are safe — reload
              to continue.
            </p>
            {this.state.error?.message && (
              <code
                className={styles.message}
                data-testid="error-boundary-message"
              >
                {this.state.error.message}
              </code>
            )}
            <button
              className={styles.reload}
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload wallet
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
