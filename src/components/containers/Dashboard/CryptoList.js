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
  const isToken = item.type === 'token'

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
        <SkeletonLoader variant="compact" />
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

const CryptoList = ({ cryptoList, onWalletItemClick }) => {
  const coins = cryptoList.filter((crypto) => crypto.type !== 'token')
  const tokens = cryptoList.filter((crypto) => crypto.type === 'token')
  const showGroupTitles = tokens.some((token) => !token.isPlaceholder)

  return (
    <div
      data-testid="crypto-list"
      className="crypto-list"
    >
      {showGroupTitles ? <h6 className="crypto-group-title">Coins</h6> : null}
      <ul className="crypto-group">
        {coins.map((crypto) => (
          <CryptoItem
            key={crypto.symbol}
            item={crypto}
            onClickItem={onWalletItemClick}
          />
        ))}
      </ul>

      {tokens.length ? (
        <>
          {showGroupTitles ? (
            <h6 className="crypto-group-title">Tokens</h6>
          ) : null}
          <ul className="crypto-group">
            {tokens.map((token) => (
              <CryptoItem
                key={token.id}
                item={token}
                onClickItem={onWalletItemClick}
              />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

export default CryptoList
