/* eslint-disable max-params */
import { useContext, useState, useEffect } from 'react'
import { PopUp, AddWallet } from '@ComposedComponents'
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
  const { addresses, accountName, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress

  const [openConnectConfirmation, setOpenConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [account, setAccount] = useState(null)

  const [connectedWalletType, setConnectedWalletType] = useState('')
  const { balance: btcBalance } = useBtcWalletInfo(currentBtcAddress)
  const { balance: mlBalance, tokenBalances } = useMlWalletInfo()
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

  const getCryptoList = (addresses, network, tokenBalances) => {
    if (!addresses) return []
    const cryptos = []
    const addCrypto = (
      name,
      symbol,
      balance,
      exchangeRate,
      change24h,
      historyRates,
      network,
      id,
    ) => {
      cryptos.push({
        id,
        name,
        symbol,
        balance: NumbersHelper.floatStringToNumber(balance),
        exchangeRate,
        change24h,
        historyRates,
        network,
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
        'bitcoin',
        'Bitcoin',
      )
    }

    const currentMlAddresses =
      networkType === AppInfo.NETWORK_TYPES.MAINNET
        ? addresses.mlMainnetAddresses
        : addresses.mlTestnetAddresses

    const mlAddress =
      currentMlAddresses &&
      currentMlAddresses.mlReceivingAddresses &&
      currentMlAddresses.mlReceivingAddresses[0]

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
        'mintlayer',
        'Mintlayer',
      )
    }

    if (tokenBalances) {
      Object.keys(tokenBalances).forEach((token) => {
        addCrypto(
          tokenBalances[token].token_info.token_ticker.string,
          tokenBalances[token].token_info.token_ticker.string,
          tokenBalances[token].balance,
          undefined,
          0,
          [],
          'mintlayer',
          token,
        )
      })
    }

    return cryptos
  }

  const goToWallet = (walletType) => {
    navigate('/wallet/' + walletType.id)
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
        cryptoList={getCryptoList(addresses, networkType, tokenBalances)}
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
