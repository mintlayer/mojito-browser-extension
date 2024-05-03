import React, { useContext } from 'react'

import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound } from '@BasicComponents'
import { Format, NumbersHelper } from '@Helpers'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './Balance.css'

const Balance = ({ balance, balanceLocked, exchangeRate, walletType }) => {
  const { networkType } = useContext(SettingsContext)
  // TODO Consider the correct format for 0,00 that might also be 0.00
  const balanceInUSD =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? '0,00'
      : NumbersHelper.floatStringToNumber(balance) * exchangeRate

  const symbol = walletType.ticker

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
        {parseFloat(balanceLocked) > 0 ? (
          <div className="balance-locked">
            Locked: {balanceLocked} {symbol}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

export default Balance
