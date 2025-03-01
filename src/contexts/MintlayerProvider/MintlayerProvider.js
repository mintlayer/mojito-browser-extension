import React, { createContext, useContext, useEffect, useState } from 'react'

import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML_ATOMS_PER_COIN } from '../../utils/Constants/AppInfo/AppInfo'
import { ML } from '@Helpers'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'

const MintlayerContext = createContext()

const MintlayerProvider = ({ value: propValue, children }) => {
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
  const [nftData, setNftData] = useState([])
  const [nftInitialUtxos, setNftInitialUtxos] = useState([])
  const [lockedUtxos, setLockedUtxos] = useState([])
  const [transactions, setTransactions] = useState([])
  const [feerate, setFeerate] = useState(0)

  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)

  const [fetchingBalances, setFetchingBalances] = useState(true)
  const [fetchingUtxos, setFetchingUtxos] = useState(true)
  const [fetchingTransactions, setFetchingTransactions] = useState(true)
  const [fetchingDelegations, setFetchingDelegations] = useState(true)
  const [fetchingTokens, setFetchingTokens] = useState(true)
  const [fetchingNft, setFetchingNft] = useState(true)
  const [allDataFetching, setAllDataFetching] = useState(false)

  const fetchAllData = async (force) => {
    // check if height is the same as online height or fetching is in progress to avoid multiple requests
    if (
      allDataFetching &&
      !force &&
      (currentAccountId === accountID || networkType === currentNetworkType)
    ) {
      return
    }

    // fetch fee rate
    const feerate = await Mintlayer.getFeesEstimates()
    setFeerate(parseInt(JSON.parse(feerate)))

    const account = LocalStorageService.getItem('unlockedAccount')

    if (!account) return

    const resetState = () => {
      setTransactions([])
      setBalance(0)
      setLockedBalance(0)
      setTokenBalances({})
      setUtxos([])
      // TODO: eneable this when after remove popup confirmation
      // setMlDelegationList([])
      setMlDelegationsBalance(0)
    }

    setAllDataFetching(true)
    setFetchingTransactions(true)
    setFetchingBalances(true)
    setFetchingUtxos(true)
    setFetchingDelegations(true)
    setFetchingTokens(true)
    setFetchingNft(true)

    resetState()
    // fetch addresses
    const addressList = currentMlAddresses
      ? [
          ...currentMlAddresses.mlReceivingAddresses,
          ...currentMlAddresses.mlChangeAddresses,
        ]
      : []

    if (addressList.length === 0) {
      setFetchingBalances(false)
      setFetchingTransactions(false)
      setFetchingUtxos(false)
      setAllDataFetching(false)
      return
    }

    setCurrentNetworkType(networkType)
    setCurrentHeight(onlineHeight)

    const addresses_data_receive = await Promise.all(
      currentMlAddresses.mlReceivingAddresses.map((address) =>
        Mintlayer.getAddressData(address),
      ),
    )
    const addresses_data_change = await Promise.all(
      currentMlAddresses.mlChangeAddresses.map((address) =>
        Mintlayer.getAddressData(address),
      ),
    )
    const addresses_data = [...addresses_data_receive, ...addresses_data_change]

    const first_unused_change_address_index = addresses_data_change.findIndex(
      (address_data) => {
        const { unused } = JSON.parse(address_data)
        return unused === true
      },
    )

    const first_unused_change_address =
      currentMlAddresses.mlChangeAddresses[first_unused_change_address_index]

    const first_unused_receive_address_index = addresses_data_receive.findIndex(
      (address_data) => {
        const { unused } = JSON.parse(address_data)
        return unused === true
      },
    )

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

    setFetchingBalances(false)

    setCurrentAccountId(accountID)

    // fetch transactions data
    const transactions = transaction_ids.map((txid) =>
      Mintlayer.getTransactionData(txid),
    )
    const transactions_data = await Promise.all(transactions)

    const parsedTransactions = ML.getParsedTransactions(
      transactions_data,
      addressList,
    )

    setTransactions(parsedTransactions)

    setFetchingTransactions(false)

    // fetch utxos
    const accountName = account && account.name
    const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
    const unconfirmedTransactions =
      LocalStorageService.getItem(unconfirmedTransactionString) || []

    const fetchedUtxos = await Mintlayer.getWalletUtxos(addressList)
    const fetchedSpendableUtxos =
      await Mintlayer.getWalletSpendableUtxos(addressList)

    const parsedUtxos = fetchedUtxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)

    const parsedSpendableUtxos = fetchedSpendableUtxos
      .map((utxo) => JSON.parse(utxo))
      .filter((utxo) => utxo.length > 0)

    const available = parsedSpendableUtxos
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

    const availableUtxos = available.map((item) => item)
    const lockedUtxos = parsedUtxos
      .flat()
      .filter((obj) => obj.utxo.type === 'LockThenTransfer')

    setUtxos(availableUtxos)
    setLockedUtxos(lockedUtxos)

    setFetchingUtxos(false)

    // Extract Token balances from UTXOs
    const tokenBalances = ML.getTokenBalances(availableUtxos)
    const tokenBalancesFiltered = Object.entries(tokenBalances).reduce(
      (acc, [key, value]) => {
        if (value > 0) {
          acc[key] = value
        }
        return acc
      },
      {},
    )

    const tokensData = await Mintlayer.getTokensData(
      Object.keys(tokenBalancesFiltered),
    )
    const mergedTokensData = Object.keys(tokenBalancesFiltered).reduce(
      (acc, key) => {
        if (tokensData[key] && Object.keys(tokensData[key]).length > 0) {
          acc[key] = {
            balance: tokenBalancesFiltered[key],
            token_info: {
              number_of_decimals: tokensData[key].number_of_decimals,
              token_ticker: tokensData[key].token_ticker,
              token_id: key,
            },
          }
        }
        return acc
      },
      {},
    )

    // Start fetching NFTs
    const availableNftInitialUtxos = parsedSpendableUtxos
      .flatMap((utxo) => [...utxo])
      .filter((item) => item.utxo.type === 'IssueNft')
    setNftInitialUtxos(availableNftInitialUtxos)

    const nftData = await Mintlayer.getNftsData(
      Object.keys(tokenBalancesFiltered),
    )

    const filteredNftsData = Object.entries(nftData).reduce(
      (acc, [key, value]) => {
        if (value && Object.keys(value).length > 0) {
          acc.push({
            token_id: key,
            data: { ...value },
          })
        }
        return acc
      },
      [],
    )

    const initialNftData = availableNftInitialUtxos.map((item) => item.utxo)
    const mergedNftsData = [...filteredNftsData, ...initialNftData]
    // End fetching NFTs

    setFetchingNft(false)
    setTokenBalances(mergedTokensData)
    setNftData(mergedNftsData)
    setFetchingTokens(false)
    setAllDataFetching(false)
  }

  const balanceLoading =
    currentAccountId !== accountID || networkType !== currentNetworkType

  const fetchDelegations = async () => {
    try {
      if (!addresses) return
      setFetchingDelegations(true)
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

      const pools = delegation_details.map((delegation) => delegation.pool_id)

      const uniquePools = [...new Set(pools)]

      const pools_data = await Mintlayer.getPoolsData(uniquePools)

      const emptyPoolsDataMap = uniquePools.reduce((acc, pool, index) => {
        if (pools_data[index].staker_balance.atoms === '0') {
          acc[pool] = pools_data[index]
        }
        return acc
      }, {})

      const mergedDelegations = delegations.map((delegation, index) => {
        return {
          ...delegation,
          decommissioned: emptyPoolsDataMap[delegation.pool_id] ? true : false,
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

      setFetchingDelegations(false)
    } catch (error) {
      console.error(error)
      setFetchingDelegations(false)
    }
  }

  useEffect(() => {
    setCurrentHeight(onlineHeight)
    // fetch addresses, utxos, transactions
    // fetch data one by one
    const getData = async () => {
      await fetchAllData()
      await fetchDelegations()
    }
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineHeight, accountID, networkType])

  useEffect(() => {
    const getData = async () => {
      const result = await Mintlayer.getChainTip()
      const { block_height } = JSON.parse(result)
      setOnlineHeight(block_height)
    }
    getData()
    const data = setInterval(getData, AppInfo.REFRESH_INTERVAL)

    return () => clearInterval(data)
  }, [])

  const getPoolsData = async (poolIds) => {
    const pools_data = await Mintlayer.getPoolsData(poolIds)
    return pools_data
  }

  const value = {
    balance,
    lockedBalance,
    tokenBalances,
    utxos,
    lockedUtxos,
    transactions,
    nftData,
    nftInitialUtxos,
    currentHeight,
    onlineHeight,
    mlDelegationsBalance,
    mlDelegationList,

    fetchAllData,
    fetchDelegations,
    getPoolsData,

    currentAccountId,
    unusedAddresses,

    balanceLoading,
    feerate,

    fetchingBalances,
    fetchingUtxos,
    fetchingTransactions,
    fetchingDelegations,
    fetchingTokens,
    fetchingNft,
    allDataFetching,
    setAllDataFetching,
  }

  return (
    <MintlayerContext.Provider value={propValue || value}>
      {children}
    </MintlayerContext.Provider>
  )
}

export { MintlayerContext, MintlayerProvider }
