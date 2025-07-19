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
    // Example token IDs and their corresponding logos
    // case 'swissdogs':
    //   logo = <SwissDogsLogo className={`swap-token-logo-icon${size === 'big' ? ' swap-token-logo-big' : ''}`} />
    //   break
    // case 'mls01':
    //   logo = <MLS01Logo className={`swap-token-logo-icon${size === 'big' ? ' swap-token-logo-big' : ''}`} />
    //   break
    // Add more cases for other token IDs and their logos
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
