import { useContext } from 'react'
import { Header } from '@ComposedComponents'
import { AccountContext } from '@Contexts'
import { useExchangeRates, useWalletInfo } from '@Hooks'
import { Dashboard } from '@ContainerComponents'
import { NumbersHelper } from '@Helpers'

const DashboardPage = () => {
  const { btcAddress } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)
  const { exchangeRate } = useExchangeRates('btc', 'usd')

  const cryptos = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(balance),
      exchangeRate
    }
  ]

  const totalBalance = cryptos
    .reduce((acc, crypto) =>
      acc + (crypto.balance * crypto.exchangeRate), 0)
console.log(totalBalance)
  return (
    <>
      <Header noBackButton />
      <Dashboard.CryptoSharesChart
        cryptos={cryptos}
        totalBalance={totalBalance} />
      <p>Dashboard</p>
      <p>{exchangeRate}</p>
      <p>{balance}</p>
    </>
  )
}

export default DashboardPage
