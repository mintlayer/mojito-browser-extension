import React from 'react'

import { ReactComponent as BtcLogo } from '../../../assets/images/btc-logo.svg'
import './Balance.css'

const Balance = ({ balance }) => {
  const btcPriceInUSD = 25000
  const balanceInUSD = balance * btcPriceInUSD
  return (
    <div
      className="balance-wrapper"
      data-testid="current-balance"
    >
      <BtcLogo />
      <div className="balance">
        <p
          className="balance-btc"
          data-testid="balance-paragraph"
        >
          <span>{balance}</span> BTC
        </p>
        <p
          className="balance-usd"
          data-testid="balance-paragraph"
        >
          <span>{balanceInUSD}</span> USD
        </p>
      </div>
    </div>
  )
}

export default Balance
