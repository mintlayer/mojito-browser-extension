import { useContext } from 'react'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import LogoMl from '@Assets/images/logo96_white.png'
import { LineChart } from '@ComposedComponents'
import { AppInfo } from '@Constants'
import { SettingsContext } from '@Contexts'

import './CryptoList.css'

const MlLogo = () => {
  return (
    <div className="connect-logo">
      <img
        src={LogoMl}
        alt="Logo"
      />
    </div>
  )
}

const CryptoItem = ({ colorList, onClickItem, item }) => {
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
      {item.name === 'Mintlayer' ? <MlLogo /> : <BtcLogo />}
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
          {Number(balance) > 0 && (
            <>
              <strong className={item.change24h < 0 ? 'negative' : 'positive'}>
                {item.change24h}%
              </strong>
              <span>24h</span>
            </>
          )}
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

const ConnectItem = ({ walletType, onClick }) => {
  const { networkType } = useContext(SettingsContext)

  const isDisabled =
    walletType.disabled ||
    (walletType.name === 'Mintlayer' && networkType !== 'testnet')

  const onItemClick = () => {
    if (!isDisabled) onClick(walletType)
  }
  const message = isDisabled ? 'Coming soon' : 'Add wallet'
  return (
    <li
      className={`crypto-item add-item ${isDisabled ? 'disabled' : ''}`}
      onClick={onItemClick}
    >
      {walletType.name === 'Mintlayer' ? <MlLogo /> : <BtcLogo />}
      <div className="name-values">
        <h5>
          {walletType.name} ({walletType.symbol})
        </h5>
      </div>
      <div className="connect-message">{message}</div>
    </li>
  )
}

const CryptoList = ({
  cryptoList,
  colorList,
  onWalletItemClick,
  onConnectItemClick,
}) => {
  const missingWalletTypes = AppInfo.walletTypes.filter(
    (walletType) =>
      !cryptoList.find((crypto) => crypto.name === walletType.name),
  )
  return (
    <>
      <ul>
        {cryptoList.length &&
          cryptoList.map((crypto) => (
            <CryptoItem
              key={crypto.symbol}
              colorList={colorList}
              item={crypto}
              onClickItem={onWalletItemClick}
            />
          ))}

        {missingWalletTypes.length &&
          missingWalletTypes.map((walletType) => (
            <ConnectItem
              key={walletType.name}
              walletType={walletType}
              onClick={onConnectItemClick}
            />
          ))}
      </ul>
    </>
  )
}

export default CryptoList
