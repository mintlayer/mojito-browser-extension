import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  getAddressData,
  getChainTip,
  getTransactionData,
} from '../../services/API/Mintlayer/Mintlayer'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML_ATOMS_PER_COIN } from '../../utils/Constants/AppInfo/AppInfo'
import { ML } from '@Helpers'

const NetworkContext = createContext()

const REFRESH_INTERVAL = 1000

const NetworkProvider = ({ value: propValue, children }) => {
  const { addresses } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses

  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(0)
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  // const [addresses, setAddresses] = useState({})
  // const [utxos, setUtxos] = useState({})
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    if (onlineHeight > currentHeight) {
      console.log('fetch data')
      setCurrentHeight(onlineHeight)
      // fetch addresses, utxos, transactions
      const getData = async () => {
        // fetch address data
        const addressList = [
          ...currentMlAddresses.mlReceivingAddresses,
          ...currentMlAddresses.mlChangeAddresses,
        ]
        const addresses = addressList.map((address) => getAddressData(address))
        const addresses_data = await Promise.all(addresses)
        let available_balance = BigInt(0)
        let locked_balance = BigInt(0)
        const transaction_ids = []
        addresses_data.forEach((address_data) => {
          const { coin_balance, locked_coin_balance, transaction_history } =
            JSON.parse(address_data)
          console.log('===', coin_balance, transaction_history)
          available_balance = coin_balance
            ? available_balance + BigInt(coin_balance.atoms)
            : available_balance
          locked_balance = locked_coin_balance
            ? locked_balance + BigInt(locked_coin_balance.atoms)
            : locked_balance
          transaction_ids.push(...transaction_history)
        })
        console.log('available_balance===', available_balance.toString())
        setBalance(Number(available_balance) / ML_ATOMS_PER_COIN)
        setLockedBalance(Number(locked_balance) / ML_ATOMS_PER_COIN)

        // fetch transactions data
        const transactions = transaction_ids.map((txid) =>
          getTransactionData(txid),
        )
        const transactions_data = await Promise.all(transactions)
        console.log('transactions_data', transactions_data)

        const parsedTransactions = ML.getParsedTransactions(
          transactions_data,
          addressList,
        )
        console.log(parsedTransactions)
        setTransactions(parsedTransactions)
      }
      getData()
    }
  }, [onlineHeight, currentHeight])

  useEffect(() => {
    const data = setInterval(() => {
      // fetch current network height
      const getData = async () => {
        const result = await getChainTip()
        const { block_height } = JSON.parse(result)
        setOnlineHeight(block_height)
      }
      getData()
    }, REFRESH_INTERVAL)

    return () => clearInterval(data)
  }, [])

  const value = {
    balance,
    lockedBalance,
    // addresses,
    // utxos,
    transactions,
    currentHeight,
    onlineHeight,
  }

  return (
    <NetworkContext.Provider value={propValue || value}>
      {children}
    </NetworkContext.Provider>
  )
}

export { NetworkContext, NetworkProvider }
