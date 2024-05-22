import React, { useContext } from 'react'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound, SkeletonLoader } from '@BasicComponents'
import { LineChart } from '@ComposedComponents'
import { AppInfo } from '@Constants'
import { SettingsContext, NetworkContext } from '@Contexts'

import './CryptoList.css'
import TokenLogoRound from '../../basic/TokenLogoRound/TokenLogoRound'

export const CryptoItem = ({ colorList, onClickItem, item }) => {
  const { networkType } = useContext(SettingsContext)
  const { balanceLoading, tokenBalances } = useContext(NetworkContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const color = colorList[item.symbol.toLowerCase()]
  const balance = item.balance
  const fiatBalance = Number(item.balance * item.exchangeRate)?.toFixed(2)
  const bigValues = balance.length > 13
  const data =
    item.historyRates &&
    Object.values(item.historyRates).map((value, idx) => [
      idx * 10,
      Number(value),
    ])
  const symbol = !isTestnet ? item.symbol : 'Testnet'

  const onClick = () => {
    onClickItem(item)
  }

  const logo = () => {
    if (item.name === 'Mintlayer') {
      return <LogoRound />
    } else if (item.name === 'Bitcoin') {
      return <BtcLogo />
    } else {
      // TODO: logo for token
      return (
        <TokenLogoRound
          text={tokenBalances[item.id].token_info.token_ticker.string.substring(
            0,
            3,
          )}
        />
      )
    }
  }

  return (
    <>
      {balanceLoading ? (
        <SkeletonLoader />
      ) : (
        <li
          key={item.symbol}
          className="crypto-item"
          onClick={onClick}
          data-testid="crypto-item"
        >
          {logo()}
          <div className="name-values">
            <h5>
              {item.name} ({symbol})
            </h5>
            <div className={`values ${bigValues ? 'big-values' : ''}`}>
              <dl>
                <dt>Value:</dt>
                <dd>{isTestnet ? balance : fiatBalance}</dd>
                {!isTestnet && (
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
                    {isTestnet ? 0 : item.change24h}%
                  </strong>
                  <span>24h</span>
                </>
              )}
            </div>
            {(!isTestnet || !data.length) && (
              <LineChart
                points={data}
                height="40px"
                width="100%"
                lineColor={color}
                lineWidth="4px"
              />
            )}
          </div>
        </li>
      )}
    </>
  )
}

export const ConnectItem = ({ walletType, onClick }) => {
  const { networkType } = useContext(SettingsContext)
  const isDisabled = walletType.disabled
  const symbol =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? walletType.symbol
      : 'Testnet'

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
          {walletType.name} ({symbol})
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
      <ul
        data-testid="crypto-list"
        className="crypto-list"
      >
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
