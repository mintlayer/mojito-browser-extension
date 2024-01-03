import { useContext, useState, useEffect } from 'react'
import { Header, PopUp, AddWallet } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { Account } from '@Entities'
import { Wallet } from '@ContainerComponents'

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
  const {
    addresses,
    accountName,
    setWalletType,
    accountID,
    openShowAddressTemp,
    setOpenShowAddressTemp,
  } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses
  const [openConnectConfirmation, setOpenConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [account, setAccount] = useState(null)

  const [connectedWalletType, setConnectedWalletType] = useState('')
  const { btcBalance } = useBtcWalletInfo(currentBtcAddress)
  const { mlBalance } = useMlWalletInfo(currentMlAddresses)
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')
  const { yesterdayExchangeRate: btcYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate: mlYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('ml', 'usd')
  const { historyRates } = useOneDayAgoHist('btc', 'usd')
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
  ]

  const cryptosTestnet = [
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

  const { currentBalances, proportionDiffs, balanceDiffs } =
    BTC.calculateBalances(cryptos, yesterdayExchangeRateList)

  const stats = BTC.getStats(proportionDiffs, balanceDiffs, networkType)

  const getCryptoList = (addresses, network) => {
    if (!addresses) return []

    const cryptos = []
    // eslint-disable-next-line max-params
    const addCrypto = (name, symbol, balance, exchangeRate, change24h) => {
      cryptos.push({
        name,
        symbol,
        balance: NumbersHelper.floatStringToNumber(balance),
        exchangeRate,
        historyRates,
        change24h,
      })
    }

    const btcAddress =
      network === AppInfo.NETWORK_TYPES.MAINNET
        ? addresses.btcMainnetAddress
        : addresses.btcTestnetAddress
    if (btcAddress) {
      const change24h =
        network === AppInfo.NETWORK_TYPES.MAINNET
          ? Number((proportionDiffs.btc - 1) * 100).toFixed(2)
          : 0
      addCrypto('Bitcoin', 'BTC', btcBalance, btcExchangeRate, change24h)
    }
    const mlMainnetAddress = addresses.mlMainnetAddress
      ? addresses.mlTestnetAddresses.mlReceivingAddresses[0]
      : false
    const mlTestnetAddress = addresses.mlTestnetAddresses
      ? addresses.mlTestnetAddresses.mlReceivingAddresses[0]
      : false
    const mlAddress =
      network === AppInfo.NETWORK_TYPES.MAINNET
        ? mlMainnetAddress
        : mlTestnetAddress
    if (mlAddress) {
      addCrypto('Mintlayer', 'ML', mlBalance, mlExchangeRate, 0)
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

      {/* //TODO: remove this after mainnet launch */}
      {openShowAddressTemp && (
        <PopUp setOpen={setOpenShowAddressTemp}>
          <Wallet.ShowAddress
            address={currentMlAddresses.mlReceivingAddresses[0]}
          ></Wallet.ShowAddress>
        </PopUp>
      )}
    </>
  )
}

export default DashboardPage
