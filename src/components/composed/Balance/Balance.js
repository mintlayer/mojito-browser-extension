import React from 'react'

import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { Format, NumbersHelper } from '@Helpers'

import './Balance.css'

const Balance = ({ balance }) => {
  const btcPriceInUSD = 25000
  const balanceInUSD =
    NumbersHelper.floatStringToNumber(balance) * btcPriceInUSD

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
          <span>{Format.BTCValue(balance)}</span> BTC
        </p>
        <p
          className="balance-usd"
          data-testid="balance-paragraph"
        >
          <span>{Format.fiatValue(balanceInUSD)}</span> USD
        </p>
      </div>
    </div>
  )
}

export default Balance
