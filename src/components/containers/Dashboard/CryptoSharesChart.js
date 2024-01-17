import { useContext } from 'react'
import { ArcChart } from '@ComposedComponents'
import { Format } from '@Helpers'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './CryptoSharesChart.css'

const CryptoSharesChart = ({
  cryptos,
  totalBalance,
  fiatSymbol = 'USD',
  accountName = 'Account Name',
  colorList,
}) => {
  const { networkType } = useContext(SettingsContext)
  const totalBalanceInFiat =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? '0'
      : Format.fiatValue(totalBalance)
  const data = cryptos.map((crypto) => ({
    value: (crypto.balance * crypto.exchangeRate).toFixed(2),
    asset: crypto.name,
    color: colorList[crypto.symbol.toLowerCase()],
    valueSymbol: fiatSymbol,
  }))

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
          {totalBalanceInFiat}
          <span> {fiatSymbol}</span>
          <em>{accountName}</em>
        </h2>
      </div>
    </>
  )
}

export default CryptoSharesChart
