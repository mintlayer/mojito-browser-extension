import React, { useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Decimal from 'decimal.js'

import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound } from '@BasicComponents'
import { Format, NumbersHelper, ML } from '@Helpers'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './Balance.css'
import TokenLogoRound from '../../basic/TokenLogoRound/TokenLogoRound'
import CopyButton from '../CopyButton/CopyButton'

const WalletName = ({ walletType }) => {
  const { tokenBalances } = useContext(MintlayerContext)
  const name =
    walletType.name.length > 18
      ? ML.formatAddress(walletType.name, 18)
      : walletType.name

  const logo = () => {
    if (walletType.name === 'Mintlayer') {
      return <LogoRound />
    }
    if (walletType.name === 'Bitcoin') {
      return <BtcLogo className="btcLogo" />
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
  return (
    <div className="wallet-logo-wrapper">
      {logo()}
      <h3>{name}</h3>
      {tokenBalances[walletType.name]?.token_info && (
        <CopyButton content={walletType.name} />
      )}
    </div>
  )
}

const Balance = ({ balance, balanceLocked, exchangeRate, walletType }) => {
  const { networkType } = useContext(SettingsContext)
  const { tokenBalances } = useContext(MintlayerContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const { coinType } = useParams()
  const navigate = useNavigate()

  const balanceInUSD = isTestnet
    ? '0,00'
    : new Decimal(NumbersHelper.floatStringToNumber(balance) || 0)
        .times(new Decimal(exchangeRate || 0))
        .toNumber()

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

  const onLockedClick = () => {
    navigate('/wallet/' + coinType + '/locked-balance')
  }

  return (
    <div
      className="balance-wrapper"
      data-testid="current-balance"
    >
      <WalletName walletType={walletType} />

      <div className="balance">
        <p
          className="balance-btc"
          data-testid="balance-paragraph"
        >
          <span>{Format.BTCValue(balance)}</span> {symbol()}
        </p>
        {!isTestnet && (
          <p
            className="balance-usd"
            data-testid="balance-paragraph"
          >
            <span>{Format.fiatValue(balanceInUSD)}</span> USD
          </p>
        )}
        {!isTestnet && (
          <span className="wallet-price">
            Price: {exchangeRate.toFixed(2)} $
          </span>
        )}
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
