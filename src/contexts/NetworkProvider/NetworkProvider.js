import React, {
  createContext, useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getAddressData,
  getChainTip,
  getTransactionData,
} from '../../services/API/Mintlayer/Mintlayer'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML_ATOMS_PER_COIN } from '../../utils/Constants/AppInfo/AppInfo'
import { ML } from '@Helpers'
import { Mintlayer } from '@APIs'

const NetworkContext = createContext()

const REFRESH_INTERVAL = 1000

const NetworkProvider = ({ value: propValue, children }) => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses

  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(0)
  const [balance, setBalance] = useState(0)
  const [tokenBalances, setTokenBalances] = useState({})
  const [lockedBalance, setLockedBalance] = useState(0)
  // const [addresses, setAddresses] = useState({})
  const [utxos, setUtxos] = useState({})
  const [transactions, setTransactions] = useState([])

  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)

  const fetchAllData = useMemo(
    () => async () => {
      // fetch addresses
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
        available_balance = coin_balance
          ? available_balance + BigInt(coin_balance.atoms)
          : available_balance
        locked_balance = locked_coin_balance
          ? locked_balance + BigInt(locked_coin_balance.atoms)
          : locked_balance
        transaction_ids.push(...transaction_history)
      })
      setBalance(Number(available_balance) / ML_ATOMS_PER_COIN)
      setLockedBalance(Number(locked_balance) / ML_ATOMS_PER_COIN)

      // fetch transactions data
      const transactions = transaction_ids.map((txid) =>
        getTransactionData(txid),
      )
      const transactions_data = await Promise.all(transactions)

      const parsedTransactions = ML.getParsedTransactions(
        transactions_data,
        addressList,
      )
      setTransactions(parsedTransactions)

      // fetch utxos
      const utxos = await Mintlayer.getWalletUtxos(addressList)
      const parsedUtxos = utxos
        .map((utxo) => JSON.parse(utxo))
        .filter((utxo) => utxo.length > 0)
      const available = parsedUtxos
        .flatMap((utxo) => [...utxo])
        .filter((item) => item.utxo.value)
        .reduce((acc, item) => {
          acc.push(item)
          return acc
        }, [])

      const availableUtxos = available.map((item) => [item])
      setUtxos(availableUtxos)

      // Extract Token balances from UTXOs
      const tokenBalances = ML.getTokenBalances(availableUtxos)
      const tokensData = await Mintlayer.getTokensData(Object.keys(tokenBalances))
      const merged = Object.keys(tokenBalances).reduce((acc, key) => {
        acc[key] = {
          balance: tokenBalances[key],
          token_info: {
            token_ticker: tokensData[key].token_ticker,
            token_id: key,
          },
        }
        return acc
      }, {})

      setTokenBalances(merged)
    },
    [currentMlAddresses],
  )

  const fetchDelegations = useCallback(async () => {
    try {
      if (!addresses) return
      // if (mlDelegationList.length === 0) {
      //   setDelegationsLoading(true)
      // }
      const addressList = [
        ...currentMlAddresses.mlReceivingAddresses,
        ...currentMlAddresses.mlChangeAddresses,
      ]
      const delegations = await Mintlayer.getWalletDelegations(addressList)
      const delegation_details = await Mintlayer.getDelegationDetails(
        delegations.map((delegation) => delegation.delegation_id),
      )
      const blocks_data = await Mintlayer.getBlocksData(
        delegation_details.map(
          (delegation) => delegation.creation_block_height,
        ),
      )

      const mergedDelegations = delegations.map((delegation, index) => {
        return {
          ...delegation,
          balance: delegation.balance.atoms,
          creation_block_height:
          delegation_details[index].creation_block_height,
          creation_time: blocks_data.find(
            ({ height }) =>
              height === delegation_details[index].creation_block_height,
          ).header.timestamp.timestamp,
        }
      })

      const totalDelegationBalance = mergedDelegations.reduce(
        (acc, delegation) => acc + Number(delegation.balance),
        0,
      )
      setMlDelegationsBalance(totalDelegationBalance)
      setMlDelegationList(mergedDelegations)
    } catch (error) {
      console.error(error)
    }
  }, [addresses])

  useEffect(() => {
    setCurrentHeight(onlineHeight)
    // fetch addresses, utxos, transactions
    fetchAllData()
    fetchDelegations()
  }, [onlineHeight, accountID])

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
    tokenBalances,
    // addresses,
    utxos,
    transactions,
    currentHeight,
    onlineHeight,
    mlDelegationsBalance,
    mlDelegationList,
  }

  return (
    <NetworkContext.Provider value={propValue || value}>
      {children}
    </NetworkContext.Provider>
  )
}

export { NetworkContext, NetworkProvider }
