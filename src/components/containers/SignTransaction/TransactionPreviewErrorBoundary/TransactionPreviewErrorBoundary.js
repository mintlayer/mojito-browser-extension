import React from 'react'

// Error Boundary Component for TransactionPreview
class TransactionPreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('TransactionPreview error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="transactionPreview">
          <div className="preview-section summary">
            <div className="preview-section-header">
              <h3>Transaction Preview</h3>
            </div>
            <div className="transactionDetails">
              <div className="signTxSection">
                <h4>Unable to display transaction details</h4>
                <p>
                  An error occurred while parsing the transaction data. Please
                  try again or contact support.
                </p>
              </div>
              {this.props.basicInfo && (
                <>
                  <div className="signTxSection">
                    <h4>Request from</h4>
                    <p>{this.props.basicInfo.origin || 'Unknown'}</p>
                  </div>
                  <div className="signTxSection">
                    <h4>Request id</h4>
                    <p>{this.props.basicInfo.requestId || 'Unknown'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default TransactionPreviewErrorBoundary
