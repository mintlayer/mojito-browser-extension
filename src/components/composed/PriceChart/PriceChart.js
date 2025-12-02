import { useContext } from 'react'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { LineChart } from '@ComposedComponents'

import './PriceChart.css'

const PriceChart = ({ data, item }) => {
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const color = AppInfo.COLOR_LIST[item.symbol.toLowerCase()]

  return (
    <div className="crypto-stats">
      <div className="crypto-stats-numbers">
        {Number(item.balance) > 0 && (
          <>
            <strong className={item.change24h < 0 ? 'negative' : 'positive'}>
              {isTestnet ? 0 : item.change24h}%
            </strong>
            <span>24h</span>
          </>
        )}
      </div>
      {(!isTestnet || !data || !data.length) && (
        <LineChart
          points={data}
          height="40px"
          width="100%"
          lineColor={color}
          lineWidth="4px"
        />
      )}
    </div>
  )
}

export default PriceChart
