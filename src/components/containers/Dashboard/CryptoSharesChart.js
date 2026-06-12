import { useContext } from 'react'
import { ArcChart } from '@ComposedComponents'
import { Format } from '@Helpers'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { BalanceSkeleton } from './DashboardSkeleton'

import './CryptoSharesChart.css'

const CryptoSharesChart = ({
  cryptos,
  totalBalance,
  fiatSymbol = 'USD',
  accountName = 'Account Name',
}) => {
  const { networkType } = useContext(SettingsContext)
  const { balanceLoading } = useContext(MintlayerContext)
  const totalBalanceInFiat =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? '0'
      : Format.fiatValue(totalBalance)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const hasBalance = totalBalance > 0 && !isTestnet

  const [integerPart, decimalPart] = totalBalanceInFiat.split(
    AppInfo.decimalSeparator,
  )

  const data = hasBalance
    ? cryptos.map((crypto) => ({
        value: (crypto.balance * crypto.exchangeRate).toFixed(2),
        asset: crypto.name,
        color: AppInfo.COLOR_LIST[crypto.symbol.toLowerCase()],
        valueSymbol: fiatSymbol,
      }))
    : [{ value: 1, asset: '', color: AppInfo.COLOR_LIST.ml, valueSymbol: '' }]

  return (
    <>
      <div className="portifolio-chart">
        <div className="chart">
          <ArcChart
            data={data}
            width="100%"
            height="100%"
          />
        </div>
        <h2>
          <em>{accountName}</em>
          {balanceLoading ? (
            <BalanceSkeleton />
          ) : (
            <span className="balance-display">
              <span className="balance-symbol">$</span>
              <span className="balance-integer">{integerPart}</span>
              {decimalPart !== undefined && (
                <>
                  <span className="balance-decimal">
                    {AppInfo.decimalSeparator}
                    {decimalPart}
                  </span>
                </>
              )}
            </span>
          )}
        </h2>
      </div>
    </>
  )
}

export default CryptoSharesChart
