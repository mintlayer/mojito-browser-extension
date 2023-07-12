import { useContext, useState } from 'react'
import { Button } from '@BasicComponents'
import { Header, PopUp, TextField } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
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
  const [opeaConnectConfirmation, setOpeaConnectConfirmation] = useState(false)
  const [allowClosing, setAllowClosing] = useState(true)
  const [passValidity, setPassValidity] = useState(false)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [connectedWalletType, setConnectedWalletType] = useState('')
  const [pass, setPass] = useState(null)
  const { btcAddress, accountName, accountID } = useContext(AccountContext)
  const { balance } = useWalletInfo(btcAddress)
  const { exchangeRate } = useExchangeRates('btc', 'usd')
  const { yesterdayExchangeRate } = useOneDayAgoExchangeRates('btc', 'usd')
  const { historyRates } = useOneDayAgoHist('btc', 'usd')
  const navigate = useNavigate()

  const changePassHandle = (value) => {
    setPass(value)
  }

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

  const onConnectItemClick = (walletType) => {
    setConnectedWalletType(walletType)
    setOpeaConnectConfirmation(true)
    setAllowClosing(true)
  }

  const connectWalletHandle = (id, pass, walletType) => {
    console.log(id, pass, walletType)
    return Account.unlockAccount(id, pass)
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
        onWalletItemClick={goToWallet}
        onConnectItemClick={onConnectItemClick}
      />
      {opeaConnectConfirmation && (
        <PopUp
          setOpen={setOpeaConnectConfirmation}
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
