import { useContext } from 'react'
import { Header } from '@ComposedComponents'
import { AccountContext } from '@Contexts'
import {
  useExchangeRates,
  useWalletInfo,
  useOneDayAgoExchangeRates,
} from '@Hooks'
import { Dashboard } from '@ContainerComponents'
import { NumbersHelper } from '@Helpers'

import './Dashboard.css'
import useOneDayAgoHist from 'src/hooks/UseOneDayAgoHist/useOneDayAgoHist'
import { useNavigate } from 'react-router-dom'

const DashboardPage = () => {
  const { btcAddresses, accountName } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddresses)
  const { exchangeRate } = useExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate } = useOneDayAgoExchangeRates('btc', 'usd')
  const { historyRates } = useOneDayAgoHist('btc', 'usd')
  const navigate = useNavigate()

  const colorList = {
    btc: '#F7931A',
    mlt: '#0C7764',
  }

  const cryptos = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(balance),
      exchangeRate,
    },
  ]

  const totalBalance = cryptos.reduce(
    (acc, crypto) => acc + crypto.balance * crypto.exchangeRate,
    0,
  )

  const yesterdayBalance = cryptos.reduce(
    (acc, crypto) => acc + crypto.balance * yesterdayExchangeRate,
    0,
  )

  const proportionDiff = totalBalance / yesterdayBalance || 0
  const balanceDiff = totalBalance - yesterdayBalance || 0

  const stats = [
    {
      name: '24h percent',
      value: Number((proportionDiff - 1) * 100).toFixed(2),
      unit: '%',
    },
    {
      name: '24h fiat',
      value: balanceDiff.toFixed(2),
      unit: 'USD',
    },
  ]

  const cryptoList = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(balance),
      exchangeRate,
      historyRates,
      change24h: Number((proportionDiff - 1) * 100).toFixed(2),
    },
  ]

  const goToWallet = () => navigate('/wallet')

  return (
    <>
      <Header noBackButton />
      <div className="stats">
        <Dashboard.CryptoSharesChart
          cryptos={cryptos}
          totalBalance={totalBalance}
          accountName={accountName}
          colorList={colorList}
        />
        <Dashboard.Statistics
          stats={stats}
          totalBalance={totalBalance}
        />
      </div>
      <Dashboard.CryptoList
        cryptoList={cryptoList}
        colorList={colorList}
        onClickItem={goToWallet}
      />
    </>
  )
}

export default DashboardPage
