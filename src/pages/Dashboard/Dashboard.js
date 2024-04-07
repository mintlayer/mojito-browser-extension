/* eslint-disable max-params */
import { useContext, useState, useEffect } from 'react'
import { Header, PopUp, AddWallet } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { Account } from '@Entities'

import {
  useExchangeRates,
  useBtcWalletInfo,
  useMlWalletInfo,
  useOneDayAgoExchangeRates,
} from '@Hooks'
import { Dashboard } from '@ContainerComponents'
import { NumbersHelper } from '@Helpers'

import './Dashboard.css'
import useOneDayAgoHist from 'src/hooks/UseOneDayAgoHist/useOneDayAgoHist'
import { useNavigate } from 'react-router-dom'
import { BTC } from '@Helpers'
import { AppInfo } from '@Constants'

const DashboardPage = () => {
  const { addresses, accountName, setWalletType, accountID } =
    useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress

  const [openConnectConfirmation, setOpenConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [account, setAccount] = useState(null)

  const [connectedWalletType, setConnectedWalletType] = useState('')
  const { btcBalance } = useBtcWalletInfo(currentBtcAddress)
  const { mlBalance } = useMlWalletInfo()
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')
  const { yesterdayExchangeRate: btcYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate: mlYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('ml', 'usd')
  const { historyRates: btcHistoryRates } = useOneDayAgoHist('btc', 'usd')
  const { historyRates: mlHistoryrates } = useOneDayAgoHist('ml', 'usd')
  const navigate = useNavigate()

  const yesterdayExchangeRateList = {
    btc: btcYesterdayExchangeRate,
    ml: mlYesterdayExchangeRate,
  }

  const colorList = {
    btc: '#F7931A',
    ml: '#0C7764',
  }

  const cryptos = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(btcBalance),
      exchangeRate: btcExchangeRate,
    },
    {
      name: 'Mintlayer',
      symbol: 'ML',
      balance: NumbersHelper.floatStringToNumber(mlBalance),
      exchangeRate: mlExchangeRate,
    },
  ]

  const cryptosTestnet = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: 0,
      exchangeRate: btcExchangeRate,
    },
    {
      name: 'Mintlayer',
      symbol: 'ML',
      balance: 0,
      exchangeRate: mlExchangeRate,
    },
  ]

  const { currentBalances, proportionDiffs, balanceDiffs } =
    BTC.calculateBalances(cryptos, yesterdayExchangeRateList)

  const stats = BTC.getStats(proportionDiffs, balanceDiffs, networkType)

  const getCryptoList = (addresses, network) => {
    if (!addresses) return []
    const cryptos = []
    const addCrypto = (
      name,
      symbol,
      balance,
      exchangeRate,
      change24h,
      historyRates,
    ) => {
      cryptos.push({
        name,
        symbol,
        balance: NumbersHelper.floatStringToNumber(balance),
        exchangeRate,
        change24h,
        historyRates,
      })
    }

    const btcAddress = addresses.btcMainnetAddress
      ? addresses.btcTestnetAddress
      : false
    if (btcAddress) {
      const change24h =
        network === AppInfo.NETWORK_TYPES.MAINNET
          ? Number((proportionDiffs.btc - 1) * 100).toFixed(2)
          : 0
      addCrypto(
        'Bitcoin',
        'BTC',
        btcBalance,
        btcExchangeRate,
        change24h,
        btcHistoryRates,
      )
    }
    const mlAddress = addresses.mlMainnetAddress
      ? addresses.mlTestnetAddresses.mlReceivingAddresses[0]
      : false
    if (mlAddress) {
      const change24h =
        network === AppInfo.NETWORK_TYPES.MAINNET
          ? Number((proportionDiffs.ml - 1) * 100).toFixed(2)
          : 0
      addCrypto(
        'Mintlayer',
        'ML',
        mlBalance,
        mlExchangeRate,
        change24h,
        mlHistoryrates,
      )
    }

    return cryptos
  }

  const goToWallet = (walletType) => {
    setWalletType(walletType)
    navigate('/wallet')
  }

  const onConnectItemClick = (walletType) => {
    setConnectedWalletType(walletType)
    setOpenConnectConfirmation(true)
    setAllowClosing(true)
  }

  const getCurrentAccount = async (accountID) => {
    const currentAccount = await Account.getAccount(accountID)
    return currentAccount
  }

  useEffect(() => {
    getCurrentAccount(accountID).then((account) => setAccount(account))
  }, [accountID])

  return (
    <>
      <Header noBackButton />
      <div className="stats">
        <Dashboard.CryptoSharesChart
          cryptos={
            networkType === AppInfo.NETWORK_TYPES.TESTNET
              ? cryptosTestnet
              : cryptos
          }
          totalBalance={currentBalances.total}
          accountName={accountName}
          colorList={colorList}
        />
        <Dashboard.Statistics
          stats={stats}
          totalBalance={currentBalances.total}
        />
      </div>
      <Dashboard.CryptoList
        cryptoList={getCryptoList(addresses, networkType)}
        colorList={colorList}
        onWalletItemClick={goToWallet}
        onConnectItemClick={onConnectItemClick}
      />
      {openConnectConfirmation && (
        <PopUp
          setOpen={setOpenConnectConfirmation}
          allowClosing={allowClosing}
        >
          <AddWallet
            account={account}
            walletType={connectedWalletType}
            setAllowClosing={setAllowClosing}
            setOpenConnectConfirmation={setOpenConnectConfirmation}
          />
        </PopUp>
      )}
    </>
  )
}

export default DashboardPage
