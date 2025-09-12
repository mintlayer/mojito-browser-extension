import { useEffect, useState, createContext, useContext } from 'react'
import { AccountContext, SettingsContext } from '@Contexts'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

import { Electrum } from '@APIs'
import { BTC, Format } from '@Helpers'
import Decimal from 'decimal.js'

const BitcoinContext = createContext()

const BitcoinProvider = ({ value: propValue, children }) => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [addressesInfo, setAddressesInfo] = useState([])
  const [formatedAddresses, setFormatedAddresses] = useState([])
  const [unusedAddresses, setUnusedAddresses] = useState([])

  const [currentBlockHeight, setCurrentBlockHeight] = useState(0)
  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentNetworkType, setCurrentNetworkType] = useState(networkType)
  const [currentAccountId, setCurrentAccountId] = useState('')

  const [btcTransactions, setBtcTransactions] = useState([])
  const [btcBalance, setBtcBalance] = useState(0)
  const [btcUtxos, setBtcUtxos] = useState([])

  const [fetchingBalances, setFetchingBalances] = useState(false)
  const [fetchingTransactions, setFetchingTransactions] = useState(false)
  const [fetchingUtxos, setFetchingUtxos] = useState(false)

  const fetchAllData = async () => {
    if (
      currentBlockHeight === onlineHeight &&
      currentAccountId === accountID &&
      networkType === currentNetworkType
    )
      return
    const account = LocalStorageService.getItem('unlockedAccount')

    if (!account) {
      console.log('Account not available yet')
      return
    }

    if (
      !addresses.btcAddresses ||
      !addresses.btcAddresses.btcChangeAddresses ||
      !addresses.btcAddresses.btcReceivingAddresses ||
      addresses.btcAddresses.btcChangeAddresses.length === 0 ||
      addresses.btcAddresses.btcReceivingAddresses.length === 0
    ) {
      console.log('Bitcoin addresses not available for current network')
      return
    }

    setBtcTransactions([])
    setBtcUtxos([])
    setBtcBalance(0)

    setFetchingBalances(true)
    setFetchingTransactions(true)
    setFetchingUtxos(true)
    setCurrentNetworkType(networkType)
    setCurrentAccountId(accountID)

    const allAddresses = addresses.btcAddresses.btcChangeAddresses.concat(
      addresses.btcAddresses.btcReceivingAddresses,
    )
    const getTransactions = async () => {
      try {
        const allTransactions = []
        for (const address of allAddresses) {
          try {
            const response = await Electrum.getAddressTransactions(address)
            const transactions = JSON.parse(response)
            const parsedTransactions = BTC.getParsedTransactions(
              transactions,
              allAddresses,
            )
            allTransactions.push(...parsedTransactions)
          } catch (error) {
            console.error(`Error fetching transactions for ${address}:`, error)
          }
        }

        const uniqueTransactions = allTransactions
          .filter(
            (tx, index, self) =>
              index === self.findIndex((t) => t.txid === tx.txid),
          )
          .sort((a, b) => b.date - a.date)

        setBtcTransactions(uniqueTransactions)
        setFetchingTransactions(false)
      } catch (error) {
        console.error('Error fetching transactions:', error)
        setFetchingTransactions(false)
      }
    }

    const getBalanceFromAddressInfo = async () => {
      try {
        const changeAddressesInfo = await Electrum.getWalletAddressesInfo(
          addresses.btcAddresses.btcChangeAddresses,
        )
        const receivingAddressesInfo = await Electrum.getWalletAddressesInfo(
          addresses.btcAddresses.btcReceivingAddresses,
        )
        const allAddressesInfo = changeAddressesInfo.concat(
          receivingAddressesInfo,
        )
        const unusedAddress = {
          receivingAddress:
            receivingAddressesInfo.find(
              (address) =>
                address.chain_stats.tx_count === 0 &&
                address.mempool_stats.tx_count === 0,
            ) || receivingAddressesInfo[0].address,
          changeAddress:
            changeAddressesInfo.find(
              (address) =>
                address.chain_stats.tx_count === 0 &&
                address.mempool_stats.tx_count === 0,
            ) || changeAddressesInfo[0].address,
        }
        setUnusedAddresses(unusedAddress)

        setAddressesInfo(allAddressesInfo)
        const formattedAddresses = []

        allAddressesInfo.forEach((addressInfo) => {
          if (
            addressInfo &&
            addressInfo.chain_stats &&
            addressInfo.mempool_stats
          ) {
            // Use Decimal for precise calculations
            const confirmedFunded = new Decimal(
              addressInfo.chain_stats.funded_txo_sum || 0,
            )
            const confirmedSpent = new Decimal(
              addressInfo.chain_stats.spent_txo_sum || 0,
            )
            const mempoolFunded = new Decimal(
              addressInfo.mempool_stats.funded_txo_sum || 0,
            )
            const mempoolSpent = new Decimal(
              addressInfo.mempool_stats.spent_txo_sum || 0,
            )
            // Calculate balance: (funded - spent) + (mempool_funded - mempool_spent)
            const confirmedBalance = confirmedFunded.minus(confirmedSpent)
            const mempoolBalance = mempoolFunded.minus(mempoolSpent)
            const addressBalanceSatoshis = confirmedBalance.plus(mempoolBalance)
            // Convert satoshis to BTC using Decimal (1 BTC = 100,000,000 satoshis)
            const addressBalanceBTC = addressBalanceSatoshis.dividedBy(
              new Decimal(100000000),
            )
            // Determine if address is used (has transactions)
            const isUsed =
              addressInfo.chain_stats.tx_count > 0 ||
              addressInfo.mempool_stats.tx_count > 0
            // Create formatted address object
            const formattedAddress = {
              coin_balance: { available: addressBalanceBTC.toFixed(8) }, // 8 decimal places for BTC
              id: addressInfo.address,
              locked_coin_balance: {},
              tokens: [],
              used: isUsed,
            }
            formattedAddresses.push(formattedAddress)
          }
        })
        // Set the formatted addresses array
        setFormatedAddresses(formattedAddresses)
        setFetchingBalances(false)
      } catch (error) {
        console.error('Error fetching address info:', error)
        setAddressesInfo([])
        setFormatedAddresses([])
        setFetchingBalances(false)
      }
    }

    const getWalletUtxos = async () => {
      try {
        const allUtxos = []
        setFetchingUtxos(true)
        for (const address of allAddresses) {
          try {
            const response = await Electrum.getAddressUtxo(address)
            const utxos = JSON.parse(response)
            const utxosWithAddress = utxos.map((utxo) => ({
              ...utxo,
              address,
            }))
            allUtxos.push(...utxosWithAddress)
          } catch (error) {
            console.error(`Error fetching UTXOs for ${address}:`, error)
          }
        }
        setBtcUtxos(allUtxos)
        setFetchingUtxos(false)
        return allUtxos
      } catch (error) {
        console.error('Error in getWalletUtxos:', error)
        setFetchingUtxos(false)
      }
    }

    const getBalance = async (utxos) => {
      try {
        const satoshiBalance = BTC.calculateBalanceFromUtxoList(utxos)
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
    const fetchedUtxos = await getWalletUtxos()
    setBtcUtxos(fetchedUtxos)
    await getBalance(fetchedUtxos)
    getBalanceFromAddressInfo()
  }

  useEffect(() => {
    Electrum.cancelAllRequests()
    setCurrentBlockHeight(onlineHeight)
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
    addressesInfo,
    fetchingBalances,
    fetchingTransactions,
    fetchingUtxos,
    formatedAddresses,
    unusedAddresses,
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
