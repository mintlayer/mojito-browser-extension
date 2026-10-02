import React from 'react'
import { ReactComponent as MlLogo } from '@Assets/images/logo.svg'
// Add more imports for other token logos as needed

import './SwapTokenLogo.css'

const SwapTokenLogo = ({ tokenId, ticker, size = 'small' }) => {
  let logo = null

  switch (tokenId) {
    case undefined:
      logo = <MlLogo className="swap-token-logo-icon" />
      break
    default:
      logo = ticker ? (
        <span className="swap-token-logo-fallback">{ticker[0]}</span>
      ) : (
        ''
      )
  }

  return (
    <div
      className={`swap-token-logo ${size === 'big' ? 'swap-token-logo-big' : ''}`}
      data-testid="swap-token-logo"
    >
      {logo}
    </div>
  )
}

export default SwapTokenLogo
