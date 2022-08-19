import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import Logo from '@Assets/images/logo96_white.png'
import { LineChart } from '@ComposedComponents'

import './CryptoList.css'

const CryptoItem = (colorList, onClickItem, item) => {
  const color = colorList[item.symbol.toLowerCase()]
  const balance = Number(item.balance * item.exchangeRate).toFixed(2)
  const bigValues = balance.length > 13
  const data = Object.values(item.historyRates).map((value, idx) => [
    idx * 10,
    Number(value),
  ])

  return (
    <li
      key={item.symbol}
      className="crypto-item"
      onClick={onClickItem}
    >
      <BtcLogo />
      <div className="name-values">
        <h5>
          {item.name} ({item.symbol})
        </h5>
        <div className={`values ${bigValues ? 'big-values' : ''}`}>
          <dl>
            <dt>Value:</dt>
            <dd>{balance}</dd>
            <dt>Price:</dt>
            <dd>{item.exchangeRate.toFixed(2)}</dd>
          </dl>
        </div>
      </div>
      <div className="crypto-stats">
        <div className="crypto-stats-numbers">
          <strong className={item.change24h < 0 ? 'negative' : 'positive'}>
            {!Number(balance) ? 0 : item.change24h}%
          </strong>
          <span>24h</span>
        </div>
        <LineChart
          points={data}
          height="40px"
          width="100%"
          lineColor={color}
          lineWidth="4px"
        />
      </div>
    </li>
  )
}

const CryptoList = ({ cryptoList, colorList, onClickItem }) => {
  return (
    <>
      <ul>
        {cryptoList.length &&
          cryptoList.map(CryptoItem.bind(null, colorList, onClickItem))}
        <li className="crypto-item coming-soon">
          <div className="mlt-logo">
            <img
              src={Logo}
              alt="MLT"
            />
          </div>
          <div className="name-values">
            <h5>Mintlayer (MLT)</h5>
          </div>
          <div>Coming Soon</div>
        </li>
      </ul>
    </>
  )
}

export default CryptoList
