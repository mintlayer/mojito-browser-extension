import { useContext } from 'react'
import { Header } from '@ComposedComponents'
import { AccountContext } from '@Contexts'
import { useExchangeRates, useWalletInfo } from '@Hooks'
import { Dashboard } from '@ContainerComponents'
import { NumbersHelper } from '@Helpers'

import './Dashboard.css'

const DashboardPage = () => {
  const { btcAddress, accountName } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)
  const { exchangeRate } = useExchangeRates('btc', 'usd')

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

  const stats = [
    {
      name: '24 hours',
      value: 5,
    },
    { name: '48 hours', value: -3.3 },
  ]

  return (
    <>
      <Header noBackButton />
      <div className="stats">
        <Dashboard.CryptoSharesChart
          cryptos={cryptos}
          totalBalance={totalBalance}
          accountName={accountName}
        />
        <Dashboard.Statistics stats={stats} />
      </div>
    </>
  )
}

export default DashboardPage
