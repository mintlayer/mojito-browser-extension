import { useContext, useState } from 'react'
import { Button } from '@BasicComponents'
import { Header, PopUp, TextField } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { AccountContext, SettingsContext } from '@Contexts'

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

const DashboardPage = () => {
  const [pass, setPass] = useState(null)
  const { addresses, accountName, accountID, setWalletType } =
    useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === 'mainnet'
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddress =
    networkType === 'mainnet'
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddress
  const [openConnectConfirmation, setOpenConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [passValidity, setPassValidity] = useState(false)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [connectedWalletType, setConnectedWalletType] = useState('')
  const { btcBalance } = useBtcWalletInfo(currentBtcAddress)
  const { mlBalance } = useMlWalletInfo(currentMlAddress)
  const { exchangeRate: btcExchangeRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlExchangeRate } = useExchangeRates('ml', 'usd')
  const { yesterdayExchangeRate: btcYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate: mlYesterdayExchangeRate } =
    useOneDayAgoExchangeRates('ml', 'usd')
  const { historyRates } = useOneDayAgoHist('btc', 'usd')
  const navigate = useNavigate()

  const changePassHandle = (value) => {
    setPass(value)
  }

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

  // TODO: it has been added to test the dashboard with multiple cryptos. Has to to be removed when the dashboard is ready
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

  const getStats = (proportionDiffs, balanceDiffs, networkType) => {
    const isTestnet = networkType === 'testnet'
    const percentValue = isTestnet
      ? 0
      : Number((proportionDiffs.total - 1) * 100).toFixed(2)
    const fiatValue = isTestnet ? 0 : balanceDiffs.total.toFixed(2)
    return [
      {
        name: '24h percent',
        value: percentValue,
        unit: '%',
      },
      {
        name: '24h fiat',
        value: fiatValue,
        unit: 'USD',
      },
    ]
  }

  const stats = getStats(proportionDiffs, balanceDiffs, networkType)

  const cryptoList = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(btcBalance),
      exchangeRate: btcExchangeRate,
      historyRates,
      change24h: Number((proportionDiffs.btc - 1) * 100).toFixed(2),
    },
  ]

  // TODO: it has been added to test the dashboard with multiple cryptos. Has to to be removed or changed when the dashboard is ready
  const cryptoListTestnet = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: NumbersHelper.floatStringToNumber(btcBalance),
      exchangeRate: btcExchangeRate,
      historyRates,
      change24h: 0,
    },
    {
      name: 'Mintlayer',
      symbol: 'ML',
      balance: NumbersHelper.floatStringToNumber(mlBalance),
      exchangeRate: mlExchangeRate,
      historyRates,
      change24h: 0,
    },
  ]

  const goToWallet = (walletType) => {
    setWalletType(walletType)
    navigate('/wallet')
  }

  const onConnectItemClick = (walletType) => {
    setConnectedWalletType(walletType)
    console.log(walletType)
    setOpenConnectConfirmation(true)
    setAllowClosing(true)
  }

  // TODO: implement correct function to creat ML wallet
  const connectWalletHandle = (id, pass, walletType) => {
    console.log(id, pass, walletType)
  }

  const onConnectSubmit = async (e) => {
    e.preventDefault()
    if (!pass) {
      setPassPristinity(false)
      setPassValidity(false)
      setPassErrorMessage('Password must be set.')
      return
    }
    setAllowClosing(false)
    try {
      const response = await connectWalletHandle(
        accountID,
        pass,
        connectedWalletType,
      )
      console.log(response)
      setPassValidity(true)
      setPassErrorMessage('')
    } catch (e) {
      console.error(e)
      setPassPristinity(false)
      setPassValidity(false)
      setPass('')
      setPassErrorMessage('Incorrect password. Account could not be unlocked')
      setAllowClosing(true)
    } finally {
      setAllowClosing(true)
    }
  }

  return (
    <>
      <Header noBackButton />
      <div className="stats">
        <Dashboard.CryptoSharesChart
          cryptos={networkType === 'testnet' ? cryptosTestnet : cryptos}
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
        cryptoList={networkType === 'testnet' ? cryptoListTestnet : cryptoList}
        colorList={colorList}
        onWalletItemClick={goToWallet}
        onConnectItemClick={onConnectItemClick}
      />
      {openConnectConfirmation && (
        <PopUp
          setOpen={setOpenConnectConfirmation}
          allowClosing={allowClosing}
        >
          <form>
            <VerticalGroup bigGap>
              <TextField
                label="Insert your password"
                placeHolder="Password"
                password
                validity={passValidity}
                pristinity={passPristinity}
                errorMessages={passErrorMessage}
                onChangeHandle={changePassHandle}
              />
              <Button onClickHandle={onConnectSubmit}>Create Wallet</Button>
            </VerticalGroup>
          </form>
        </PopUp>
      )}
    </>
  )
}

export default DashboardPage
