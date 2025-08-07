import { useEffect, useState, createContext, useContext } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

import { Electrum } from '@APIs'
import { BTC, Format } from '@Helpers'

const BitcoinContext = createContext()

const BitcoinProvider = ({ value: propValue, children }) => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)
  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentNetworkType, setCurrentNetworkType] = useState(networkType)

  const [btcTransactions, setBtcTransactions] = useState([])
  const [btcBalance, setBtcBalance] = useState(0)
  const [btcUtxos, setBtcUtxos] = useState([])

  const [fetchingBalances, setFetchingBalances] = useState(false)
  const [fetchingTransactions, setFetchingTransactions] = useState(false)
  const [fetchingUtxos, setFetchingUtxos] = useState(false)

  const fetchAllData = async () => {
    const account = LocalStorageService.getItem('unlockedAccount')

    if (!account || !addresses) {
      console.log('Account or addresses not available yet')
      return
    }

    const currentBtcAddress =
      networkType === AppInfo.NETWORK_TYPES.MAINNET
        ? addresses?.btcMainnetAddress
        : addresses?.btcTestnetAddress

    if (!currentBtcAddress) {
      console.log('Bitcoin address not available for current network')
      return
    }

    setBtcTransactions([])
    setBtcUtxos([])
    setBtcBalance(0)

    setFetchingBalances(true)
    setFetchingTransactions(true)
    setFetchingUtxos(true)
    setCurrentNetworkType(networkType)

    const getTransactions = async () => {
      try {
        const response =
          await Electrum.getAddressTransactions(currentBtcAddress)
        const transactions = JSON.parse(response)
        const parsedTransactions = BTC.getParsedTransactions(
          transactions,
          currentBtcAddress,
        )
        setBtcTransactions(parsedTransactions)
        setFetchingTransactions(false)
      } catch (error) {
        console.error(error)
        setFetchingTransactions(false)
      }
    }

    const getWalletUtxos = async () => {
      try {
        setFetchingUtxos(true)
        const utxos = await Electrum.getAddressUtxo(currentBtcAddress)
        setBtcUtxos(JSON.parse(utxos))
        setFetchingUtxos(false)
      } catch (error) {
        console.error(error)
        setFetchingUtxos(false)
      }
    }

    const getBalance = async () => {
      try {
        const utxos = await Electrum.getAddressUtxo(currentBtcAddress)
        const satoshiBalance = BTC.calculateBalanceFromUtxoList(
          JSON.parse(utxos),
        )
        const balanceConvertedToBTC = BTC.convertSatoshiToBtc(satoshiBalance)
        const formattedBalance = Format.BTCValue(balanceConvertedToBTC)
        setBtcBalance(formattedBalance)
        setFetchingBalances(false)
      } catch (error) {
        console.error(error)
        setFetchingBalances(false)
      }
    }

    await getTransactions()
    await getWalletUtxos()
    await getBalance()
  }

  useEffect(() => {
    setCurrentBlockHeight(onlineHeight)
    // fetch addresses, utxos, transactions
    // fetch data one by one
    const getData = async () => {
      await fetchAllData()
    }
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineHeight, accountID, networkType, addresses])

  useEffect(() => {
    const getData = async () => {
      const result = await Electrum.getLastBlockHeight()
      setOnlineHeight(result)
    }
    getData()
    const data = setInterval(getData, AppInfo.REFRESH_INTERVAL)

    return () => clearInterval(data)
  }, [])

  useEffect(() => {
    if (networkType !== currentNetworkType) {
      fetchAllData(true)
    }
  })

  const value = {
    btcBalance,
    btcTransactions,
    btcUtxos,
    currentBlockHeight,

    fetchingBalances,
    fetchingTransactions,
    fetchingUtxos,
    setFetchingBalances,
    setFetchingTransactions,
    setFetchingUtxos,

    fetchAllData,
  }

  return (
    <BitcoinContext.Provider value={propValue || value}>
      {children}
    </BitcoinContext.Provider>
  )
}

export { BitcoinContext, BitcoinProvider }
