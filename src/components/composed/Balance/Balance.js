import React, { useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound } from '@BasicComponents'
import { Format, NumbersHelper, ML } from '@Helpers'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './Balance.css'
import TokenLogoRound from '../../basic/TokenLogoRound/TokenLogoRound'

const Balance = ({ balance, balanceLocked, exchangeRate, walletType }) => {
  const { networkType } = useContext(SettingsContext)
  const { coinType } = useParams()
  const navigate = useNavigate()
  const { tokenBalances } = useContext(MintlayerContext)
  const name =
    walletType.name.length > 25
      ? ML.formatAddress(walletType.name)
      : walletType.name
  // TODO Consider the correct format for 0,00 that might also be 0.00
  const balanceInUSD =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? '0,00'
      : NumbersHelper.floatStringToNumber(balance) * exchangeRate

  const symbol = () => {
    if (walletType.name === 'Mintlayer') {
      return 'ML'
    }
    if (walletType.name === 'Bitcoin') {
      return 'BTC'
    }
    if (
      !tokenBalances ||
      !tokenBalances[walletType.name] ||
      !tokenBalances[walletType.name].token_info
    ) {
      return 'TKN'
    }
    return tokenBalances[walletType.name].token_info.token_ticker.string
  }

  const logo = () => {
    if (walletType.name === 'Mintlayer') {
      return <LogoRound />
    }
    if (walletType.name === 'Bitcoin') {
      return <BtcLogo />
    }
    if (
      !tokenBalances ||
      !tokenBalances[walletType.name] ||
      !tokenBalances[walletType.name].token_info
    ) {
      return <TokenLogoRound text={'TKN'} />
    }
    return (
      <TokenLogoRound
        text={tokenBalances[
          walletType.name
        ].token_info.token_ticker.string.substring(0, 3)}
      />
    )
  }

  const onLockedClick = () => {
    navigate('/wallet/' + coinType + '/locked-balance')
  }

  return (
    <div
      className="balance-wrapper"
      data-testid="current-balance"
    >
      <div className="wallet-logo-wrapper">
        {logo()}
        <h3>{name}</h3>
      </div>

      <div className="balance">
        <p
          className="balance-btc"
          data-testid="balance-paragraph"
        >
          <span>{Format.BTCValue(balance)}</span> {symbol()}
        </p>
        <p
          className="balance-usd"
          data-testid="balance-paragraph"
        >
          <span>{Format.fiatValue(balanceInUSD)}</span> USD
        </p>
        {parseFloat(balanceLocked) > 0 ? (
          <button
            className="balance-locked"
            onClick={onLockedClick}
          >
            Locked: {balanceLocked} {symbol()}
          </button>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

export default Balance
