import { useContext } from 'react'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound, SkeletonLoader } from '@BasicComponents'
import { LineChart } from '@ComposedComponents'
import { AppInfo } from '@Constants'
import { SettingsContext, AccountContext } from '@Contexts'

import './CryptoList.css'

//TODO: remove this when mainnet is ready
const MainnetAddressItem = () => {
  const { setOpenShowAddressTemp } = useContext(AccountContext)
  const onItemClick = () => {
    setOpenShowAddressTemp(true)
  }
  return (
    <li
      className="crypto-item coming-soon"
      onClick={onItemClick}
    >
      <div className="mlt-logo">
        <LogoRound />
      </div>
      <div className="name-values">
        <h5>Mintlayer (ML)</h5>
        <p className="show-address-text">
          Click here to get your Mainnet address
        </p>
      </div>
    </li>
  )
}

export const CryptoItem = ({ colorList, onClickItem, item }) => {
  const { balanceLoading } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const color = colorList[item.symbol.toLowerCase()]
  const balance =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? item.balance
      : Number(item.balance * item.exchangeRate).toFixed(2)
  const bigValues = balance.length > 13
  const data = Object.values(item.historyRates).map((value, idx) => [
    idx * 10,
    Number(value),
  ])

  const onClick = () => {
    onClickItem(item)
  }

  return (
    <>
      {balanceLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* TODO: remove this when mainnet is ready */}
          {item.name === 'Mintlayer' &&
          networkType === AppInfo.NETWORK_TYPES.MAINNET ? (
            <MainnetAddressItem />
          ) : (
            <li
              key={item.symbol}
              className="crypto-item"
              onClick={onClick}
              data-testid="crypto-item"
            >
              {item.name === 'Mintlayer' ? <LogoRound /> : <BtcLogo />}
              <div className="name-values">
                <h5>
                  {item.name} ({item.symbol})
                </h5>
                <div className={`values ${bigValues ? 'big-values' : ''}`}>
                  <dl>
                    <dt>Value:</dt>
                    <dd>{balance}</dd>
                    {networkType !== AppInfo.NETWORK_TYPES.TESTNET && (
                      <>
                        <dt>Price:</dt>
                        <dd>{item.exchangeRate.toFixed(2)}</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>
              <div className="crypto-stats">
                <div className="crypto-stats-numbers">
                  {Number(balance) > 0 && (
                    <>
                      <strong
                        className={item.change24h < 0 ? 'negative' : 'positive'}
                      >
                        {networkType === AppInfo.NETWORK_TYPES.TESTNET
                          ? 0
                          : item.change24h}
                        %
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
          )}
        </>
      )}
    </>
  )
}

export const ConnectItem = ({ walletType, onClick }) => {
  const isDisabled = walletType.disabled

  const onItemClick = () => {
    if (!isDisabled) onClick(walletType)
  }
  const message = isDisabled ? 'Coming soon' : 'Add wallet'
  return (
    <li
      className={`crypto-item add-item ${isDisabled ? 'disabled' : ''}`}
      onClick={onItemClick}
      data-testid="connect-item"
    >
      {walletType.name === 'Mintlayer' ? <LogoRound /> : <BtcLogo />}
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
      <ul data-testid="crypto-list">
        {cryptoList.length
          ? cryptoList.map((crypto) => (
              <CryptoItem
                key={crypto.symbol}
                colorList={colorList}
                item={crypto}
                onClickItem={onWalletItemClick}
              />
            ))
          : null}

        {missingWalletTypes.length
          ? missingWalletTypes.map((walletType) => (
              <ConnectItem
                key={walletType.name}
                walletType={walletType}
                onClick={onConnectItemClick}
              />
            ))
          : null}
      </ul>
    </>
  )
}

export default CryptoList
