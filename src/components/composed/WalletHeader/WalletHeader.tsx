import React, { useContext, useMemo } from 'react'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound } from '@BasicComponents'
import { SettingsContext, MintlayerContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { Format } from '@Helpers'
import Decimal from 'decimal.js'
import { useExchangeRates, useOneDayAgoExchangeRates } from '@Hooks'
import TokenLogoRound from '../../basic/TokenLogoRound/TokenLogoRound'

import styles from './WalletHeader.module.css'

interface WalletType {
  name: string
  ticker: string
  chain: string
}

interface WalletHeaderProps {
  walletType: WalletType
}

const getChange24h = (
  isTestnet: boolean,
  exchangeRate: number | undefined,
  yesterdayExchangeRate: number | undefined,
) => {
  if (isTestnet || !exchangeRate || !yesterdayExchangeRate) return 0
  if (yesterdayExchangeRate === 0) return 0
  const raw = new Decimal(exchangeRate)
    .minus(yesterdayExchangeRate)
    .div(yesterdayExchangeRate)
    .times(100)
  if (raw.isZero()) return 0
  const abs = raw.abs()
  if (abs.gte(0.01)) return raw.toDecimalPlaces(2).toNumber()
  const digits = Math.max(2, -Math.floor(Math.log10(abs.toNumber())) + 2)
  return raw.toDecimalPlaces(digits).toNumber()
}

const WalletHeader = ({ walletType }: WalletHeaderProps) => {
  const { networkType } = useContext(SettingsContext)
  const { tokenBalances } = useContext(MintlayerContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const isToken =
    walletType.name !== 'Mintlayer' && walletType.name !== 'Bitcoin'

  const ticker = walletType.ticker.toLowerCase()
  const { exchangeRate } = useExchangeRates(ticker, 'usd')
  const { yesterdayExchangeRate } = useOneDayAgoExchangeRates(ticker, 'usd')

  const change24h = getChange24h(isTestnet, exchangeRate, yesterdayExchangeRate)

  const displayName = useMemo(() => {
    if (isToken) {
      const tokenInfo = tokenBalances?.[walletType.name]?.token_info
      return tokenInfo?.token_ticker?.string || walletType.name
    }
    return walletType.name
  }, [isToken, tokenBalances, walletType.name])

  const networkLabel = isTestnet ? ' (Testnet)' : ''

  const priceDisplay = isTestnet
    ? '$0'
    : `$${Format.fiatValue(exchangeRate ?? 0)}`

  const logoText = useMemo(() => {
    return (
      tokenBalances?.[
        walletType.name
      ]?.token_info?.token_ticker?.string?.substring(0, 3) || 'TKN'
    )
  }, [tokenBalances, walletType.name])

  const renderLogo = () => {
    if (walletType.name === 'Mintlayer') return <LogoRound small />
    if (walletType.name === 'Bitcoin') return <BtcLogo />
    return (
      <TokenLogoRound
        text={logoText}
        small
      />
    )
  }

  return (
    <div
      className={styles.walletHeader}
      data-testid="wallet-header"
    >
      <div className={styles.logo}>{renderLogo()}</div>
      <div className={styles.info}>
        <h2 className={styles.name}>
          {displayName}
          {networkLabel}
        </h2>
        {!isToken && (
          <span className={styles.subtitle}>
            {priceDisplay}
            {' · '}
            <span
              className={
                change24h >= 0 ? styles.changePositive : styles.changeNegative
              }
            >
              {change24h >= 0 ? '+' : ''}
              {change24h}%
            </span>
          </span>
        )}
      </div>
    </div>
  )
}

export default WalletHeader
