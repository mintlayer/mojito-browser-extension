import React, { useContext } from 'react'
import { ReactComponent as BtcLogo } from '@Assets/images/btc-logo.svg'
import { LogoRound, SkeletonLoader } from '@BasicComponents'
import { PriceChart } from '@ComposedComponents'
import { AppInfo } from '@Constants'
import { SettingsContext, MintlayerContext } from '@Contexts'

import './CryptoList.css'
import TokenLogoRound from '../../basic/TokenLogoRound/TokenLogoRound'

export const CryptoItem = ({ onClickItem, item }) => {
  const { networkType } = useContext(SettingsContext)
  const fetchingBalances = item.fetchingBalances
  const isBtcUnavailable = item.disabled
  const { tokenBalances } = useContext(MintlayerContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
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
  const isToken = item.name !== 'Mintlayer' && item.name !== 'Bitcoin'

  const onClick = () => {
    if (!isBtcUnavailable) {
      onClickItem(item)
    }
  }

  const logoText =
    tokenBalances[item.id]?.token_info?.token_ticker?.string.substring(0, 3) ||
    'TKN'

  const logo = () => {
    if (item.name === 'Mintlayer') {
      return <LogoRound small />
    } else if (item.name === 'Bitcoin') {
      return <BtcLogo />
    } else {
      // TODO: logo for token
      return (
        <TokenLogoRound
          text={logoText}
          small
        />
      )
    }
  }

  return (
    <>
      {fetchingBalances ? (
        <SkeletonLoader />
      ) : (
        <li
          key={item.symbol}
          className={`crypto-item ${isBtcUnavailable ? 'disabled' : ''}`}
          onClick={onClick}
          data-testid="crypto-item"
        >
          {isBtcUnavailable && (
            <div className="crypto-network-mask-full">
              <span className="crypto-network-mask-text">Offline</span>
            </div>
          )}
          <div className="logo-wrapper">
            {logo()}
            <div className="name-values">
              <h5>
                {item.name} ({symbol})
              </h5>
              <div className={`values ${bigValues ? 'big-values' : ''}`}>
                <dl>
                  {!isTestnet && !isToken ? (
                    <>
                      <dd>
                        {balance} {symbol}
                      </dd>
                      <dt>|</dt>
                      <dd>{fiatBalance} $</dd>
                    </>
                  ) : (
                    <dd>{balance}</dd>
                  )}
                </dl>
              </div>
            </div>
          </div>

          <PriceChart
            data={data}
            item={item}
          />
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
const CryptoList = ({ cryptoList, onWalletItemClick, onConnectItemClick }) => {
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
