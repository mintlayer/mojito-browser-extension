import React, {
  createContext,
  useCallback,
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
import { LocalStorageService } from '@Storage'

const NetworkContext = createContext()

const REFRESH_INTERVAL = 1000 * 60 // one per minute

const NetworkProvider = ({ value: propValue, children }) => {
  const { addresses, accountID, accountName } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses

  const [currentAccountId, setCurrentAccountId] = useState('')
  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(0)
  const [currentNetworkType, setCurrentNetworkType] = useState(networkType)
  const [balance, setBalance] = useState(0)
  const [tokenBalances, setTokenBalances] = useState({})
  const [lockedBalance, setLockedBalance] = useState(0)
  const [unusedAddresses, setUnusedAddresses] = useState({})
  const [utxos, setUtxos] = useState([])
  const [transactions, setTransactions] = useState([])
  const [feerate, setFeerate] = useState(0)

  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)

  const fetchAllData = useMemo(
    () => async () => {
      // fetch fee rate
      const feerate = await Mintlayer.getFeesEstimates()
      setFeerate(parseInt(JSON.parse(feerate)))

      // fetch addresses
      const addressList = currentMlAddresses
        ? [
            ...currentMlAddresses.mlReceivingAddresses,
            ...currentMlAddresses.mlChangeAddresses,
          ]
        : []
      const addresses_data_receive = await Promise.all(
        currentMlAddresses.mlReceivingAddresses.map((address) =>
          getAddressData(address),
        ),
      )
      const addresses_data_change = await Promise.all(
        currentMlAddresses.mlChangeAddresses.map((address) =>
          getAddressData(address),
        ),
      )
      const addresses_data = [
        ...addresses_data_receive,
        ...addresses_data_change,
      ]

      const first_unused_change_address_index = addresses_data_change.findIndex(
        (address_data) => {
          const { unused } = JSON.parse(address_data)
          return unused === true
        },
      )

      const first_unused_change_address =
        currentMlAddresses.mlChangeAddresses[first_unused_change_address_index]

      const first_unused_receive_address_index =
        addresses_data_receive.findIndex((address_data) => {
          const { unused } = JSON.parse(address_data)
          return unused === true
        })

      const first_unused_receive_address =
        currentMlAddresses.mlReceivingAddresses[
          first_unused_receive_address_index
        ]

      setUnusedAddresses({
        change: first_unused_change_address,
        receive: first_unused_receive_address,
      })

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

      setCurrentAccountId(accountID)

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
      const account = LocalStorageService.getItem('unlockedAccount')
      const networkType = LocalStorageService.getItem('networkType')
      const accountName = account.name
      const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
      const unconfirmedTransactions =
        LocalStorageService.getItem(unconfirmedTransactionString) || []

      const utxos = await Mintlayer.getWalletUtxos(addressList)
      const parsedUtxos = utxos
        .map((utxo) => JSON.parse(utxo))
        .filter((utxo) => utxo.length > 0)
      const available = parsedUtxos
        .flatMap((utxo) => [...utxo])
        .filter((item) => item.utxo.value)
        .filter((item) => {
          if (unconfirmedTransactions) {
            return !unconfirmedTransactions.some(
              (unconfirmedTransaction) =>
                unconfirmedTransaction.usedUtxosOutpoints &&
                unconfirmedTransaction.usedUtxosOutpoints.filter(
                  (utxo) =>
                    utxo.source_id === item.outpoint.source_id &&
                    utxo.index === item.outpoint.index,
                ).length > 0,
            )
          }
          return true
        })
        .reduce((acc, item) => {
          acc.push(item)
          return acc
        }, [])

      setCurrentNetworkType(networkType)

      const availableUtxos = available.map((item) => item)
      setUtxos(availableUtxos)

      // Extract Token balances from UTXOs
      const tokenBalances = ML.getTokenBalances(availableUtxos)
      const tokensData = await Mintlayer.getTokensData(
        Object.keys(tokenBalances),
      )
      const merged = Object.keys(tokenBalances).reduce((acc, key) => {
        acc[key] = {
          balance: tokenBalances[key],
          token_info: {
            number_of_decimals: tokensData[key].number_of_decimals,
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

  const balanceLoading =
    currentAccountId !== accountID || networkType !== currentNetworkType

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

      const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
      const unconfirmedTransactions =
        LocalStorageService.getItem(unconfirmedTransactionString) || []

      const delegationTransactions = unconfirmedTransactions.filter(
        (unconfirmedTransaction) =>
          unconfirmedTransaction.mode ===
          AppInfo.ML_TRANSACTION_MODES.DELEGATION,
      )

      if (delegationTransactions.length > 0) {
        mergedDelegations.unshift(...delegationTransactions)
      }

      const totalDelegationBalance = mergedDelegations.reduce(
        (acc, delegation) =>
          acc + (delegation.balance ? Number(delegation.balance) : 0),
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
  }, [onlineHeight, accountID, networkType])

  useEffect(() => {
    const getData = async () => {
      const result = await getChainTip()
      const { block_height } = JSON.parse(result)
      setOnlineHeight(block_height)
    }
    getData()
    const data = setInterval(getData, REFRESH_INTERVAL)

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

    fetchAllData,
    fetchDelegations,

    currentAccountId,
    unusedAddresses,

    balanceLoading,
    feerate,
  }

  return (
    <NetworkContext.Provider value={propValue || value}>
      {children}
    </NetworkContext.Provider>
  )
}

export { NetworkContext, NetworkProvider }
