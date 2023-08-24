import React, { useContext } from 'react'

import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound } from '@BasicComponents'
import { Format, NumbersHelper } from '@Helpers'
import { AccountContext, SettingsContext } from '@Contexts'

import './Balance.css'

const Balance = ({ balance, exchangeRate }) => {
  const { walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  // TODO Consider the correct format for 0,00 that might also be 0.00
  const balanceInUSD =
    networkType === 'testnet'
      ? '0,00'
      : NumbersHelper.floatStringToNumber(balance) * exchangeRate

  const symbol = walletType.name === 'Mintlayer' ? 'ML' : 'BTC'

  return (
    <div
      className="balance-wrapper"
      data-testid="current-balance"
    >
      {walletType.name === 'Mintlayer' ? <LogoRound /> : <BtcLogo />}
      <div className="balance">
        <p
          className="balance-btc"
          data-testid="balance-paragraph"
        >
          <span>{Format.BTCValue(balance)}</span> {symbol}
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
