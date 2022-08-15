import { ArcChart } from '@ComposedComponents'

import './CryptoSharesChart.css'

const CryptoSharesChart = ({cryptos, totalBalance, fiatSymbol = 'USD'}) => {
  const colorList = [ '#0C7764', '#F7931A' ]

  const data = cryptos.map((crypto, index) => ({
    value: (crypto.balance * crypto.exchangeRate).toFixed(2),
    asset: crypto.name,
    color: colorList[index],
    valueSymbol: fiatSymbol
  }))

  return (
    <>
      <div className='chart'>
        <ArcChart
          data={data}
          width="100%"
          height="100%" />
      </div>
      <p>{`${totalBalance.toFixed(2)} ${fiatSymbol}`}</p>
    </>
  )
}

export default CryptoSharesChart
