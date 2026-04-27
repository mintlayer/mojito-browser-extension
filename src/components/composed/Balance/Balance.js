import React, { useContext } from 'react'
import { useNavigate, useParams } from 'react-router'
import Decimal from 'decimal.js'

import { LineChart } from '@ComposedComponents'
import { Format, NumbersHelper } from '@Helpers'
import {
  MintlayerContext,
  SettingsContext,
  ExchangeRatesContext,
} from '@Contexts'
import { AppInfo } from '@Constants'

import './Balance.css'

const Balance = ({ balance, balanceLocked, exchangeRate, walletType }) => {
  const { networkType } = useContext(SettingsContext)
  const { tokenBalances } = useContext(MintlayerContext)
  const { thirtyDaysHistoryRates } = useContext(ExchangeRatesContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const { coinType } = useParams()
  const navigate = useNavigate()

  const isToken =
    walletType.name !== 'Mintlayer' && walletType.name !== 'Bitcoin'

  const balanceInUSD = isTestnet
    ? 0
    : new Decimal(NumbersHelper.floatStringToNumber(balance) || 0)
        .times(new Decimal(exchangeRate || 0))
        .toNumber()

  const getSymbol = () => {
    if (
      walletType.name === 'Mintlayer' &&
      networkType === AppInfo.NETWORK_TYPES.TESTNET
    )
      return 'TML'
    if (walletType.name === 'Mintlayer') return 'ML'
    if (
      walletType.name === 'Bitcoin' &&
      networkType === AppInfo.NETWORK_TYPES.TESTNET
    )
      return 'TBTC'
    if (walletType.name === 'Bitcoin') return 'BTC'
    if (!tokenBalances?.[walletType.name]?.token_info) return 'TKN'
    return tokenBalances[walletType.name].token_info.token_ticker.string
  }

  const ticker = walletType.ticker.toLowerCase()
  const ratesKey = `${ticker}-usd`

  const thirtyDaysChartRates = thirtyDaysHistoryRates?.[ratesKey]
  const thirtyDaysChartData = isToken
    ? [
        [0, 80],
        [100, 80],
      ]
    : thirtyDaysChartRates &&
      Object.values(thirtyDaysChartRates).map((value, idx) => [
        idx * 10,
        Number(value),
      ])

  const chartColor = AppInfo.COLOR_LIST[ticker]

  const onLockedClick = () => {
    navigate('/wallet/' + coinType + '/locked-balance')
  }

  return (
    <div
      className="balance-card"
      data-testid="current-balance"
    >
      <div>
        <span className="balance-label">Balance</span>
        <p className="balance-amount">
          <span className="balance-value">{Format.BTCValue(balance)}</span>{' '}
          <span className="balance-ticker">{getSymbol()}</span>
        </p>
        {!isToken && (
          <span className="balance-fiat">
            ≈ ${Format.fiatValue(balanceInUSD)}
          </span>
        )}
        {parseFloat(balanceLocked) > 0 && (
          <button
            className="balance-locked"
            onClick={onLockedClick}
          >
            Locked: {balanceLocked} {getSymbol()}
          </button>
        )}
      </div>

      {thirtyDaysChartData && thirtyDaysChartData.length > 0 && (
        <div className="balance-chart balance-chart-30d">
          <span className="balance-chart-label">30 days</span>
          <LineChart
            points={thirtyDaysChartData}
            height="60px"
            width="100%"
            lineColor={chartColor}
            lineWidth="2px"
          />
        </div>
      )}
    </div>
  )
}

export default Balance
