import React, { createContext, useContext, useEffect, useState } from 'react'

import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML_ATOMS_PER_COIN } from '../../utils/Constants/AppInfo/AppInfo'
import { ML } from '@Helpers'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'
import { batchRequestMintlayer } from '../../services/API/Mintlayer/Mintlayer'

const MintlayerContext = createContext()

class InMemoryAccountProvider {
  addresses = {}
  navigate = null

  constructor(addresses, navigate) {
    this.addresses = {
      testnet: {
        receiving: addresses.testnet.receiving || [],
        change: addresses.testnet.change || [],
      },
    }
    this.navigate = navigate
  }

  async connect() {
    return this.addresses
  }

  async restore() {
    return this.addresses
  }

  async disconnect() {
    return
  }

  async request(method, params) {
    console.log('methidparams', method, params)
    if (method === 'signTransaction') {
      const { txData } = params
      console.log('++++++++++++++++++txData', txData)
      if (!txData) {
        throw new Error('Transaction is required for signing')
      }
      this.navigate('/wallet/Mintlayer/sign-internal-transaction', {
        state: {
          action: 'signTransaction',
          request: { action: 'signTransaction', data: { txData } },
        },
      })
      return
    }

    throw new Error('Signing not supported in InMemoryAccountProvider')
  }
}

const MintlayerProvider = ({ value: propValue, children }) => {
  const { addresses, accountID, accountName } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const [txPreviewInfo, setTxPreviewInfo] = useState(null)
  const [currentAccountId, setCurrentAccountId] = useState('')
  const [onlineHeight, setOnlineHeight] = useState(0)
  const [currentHeight, setCurrentHeight] = useState(0)
  const [currentNetworkType, setCurrentNetworkType] = useState(networkType)
  const [balance, setBalance] = useState(0)
  const [tokenBalances, setTokenBalances] = useState({})
  const [allNetworkTokensData, setAllNetworkTokensData] = useState([])
  const [lockedBalance, setLockedBalance] = useState(0)
  const [unusedAddresses, setUnusedAddresses] = useState({})
  const [utxos, setUtxos] = useState([])
  const [nftData, setNftData] = useState([])
  const [nftInitialUtxos, setNftInitialUtxos] = useState([])
  const [lockedUtxos, setLockedUtxos] = useState([])
  const [transactions, setTransactions] = useState([])
  const [feerate, setFeerate] = useState(0)
  const [client, setClient] = useState(null)

  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)

  const [fetchingBalances, setFetchingBalances] = useState(true)
  const [fetchingUtxos, setFetchingUtxos] = useState(true)
  const [fetchingTransactions, setFetchingTransactions] = useState(true)
  const [fetchingDelegations, setFetchingDelegations] = useState(true)
  const [fetchingTokens, setFetchingTokens] = useState(true)
  const [fetchingNft, setFetchingNft] = useState(true)
  const [allDataFetching, setAllDataFetching] = useState(false)
  const [ordersPairInfo, setOrdersPairInfo] = useState([])
  const [tokenMap, setTokenMap] = useState({})
  const [orderPairLoading, setOrderPairLoading] = useState(false)

  const fetchOrdersPairInfo = async (orderPair, amount) => {
    setOrderPairLoading(true)
    const coinTicker =
      networkType === AppInfo.NETWORK_TYPES.TESTNET ? 'TML' : 'ML'
    const swapPairsCurrency = orderPair.split('_')
    const ordersPairInfo = await Mintlayer.getOrdersListByPair(orderPair)
    if (!ordersPairInfo || ordersPairInfo.length === 0) {
      console.log('No orders found for this pair')
      setOrderPairLoading(false)
      setOrdersPairInfo([])
      return []
    }
    if (ordersPairInfo && ordersPairInfo.length > 0) {
      const pairWIthTikers = ordersPairInfo.reduce((acc, order) => {
        if (
          ((order.ask_currency.type === 'Coin' &&
            swapPairsCurrency[0] === coinTicker) ||
            (order.ask_currency.token_id &&
              order.ask_currency.token_id === swapPairsCurrency[0])) &&
          Number(order.ask_balance.decimal) >= Number(amount)
        ) {
          acc.push({
            ...order,
            ask_currency: {
              ...order.ask_currency,
              ticker:
                order.ask_currency.type === 'Coin'
                  ? coinTicker
                  : tokenMap[order.ask_currency.token_id] || '',
            },
            give_currency: {
              ...order.give_currency,
              ticker:
                order.give_currency.type === 'Coin'
                  ? coinTicker
                  : tokenMap[order.give_currency.token_id] || '',
            },
            quote_rate: ML.calculateExchangeRate(
              order.ask_balance.decimal,
              order.give_balance.decimal,
            ),
          })
        }
        return acc
      }, [])
      setOrdersPairInfo(pairWIthTikers)
      setOrderPairLoading(false)
      return pairWIthTikers
    }
  }

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

    setAllDataFetching(true)
    setFetchingTransactions(true)
    setFetchingBalances(true)
    setFetchingUtxos(true)
    setFetchingDelegations(true)
    setFetchingTokens(true)
    setFetchingNft(true)

    // resetState()
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

    const addresses_data_receive_data = await batchRequestMintlayer({
      ids: currentMlAddresses.mlReceivingAddresses,
      type: '/address/:address',
    })
    const addresses_data_change_data = await batchRequestMintlayer({
      ids: currentMlAddresses.mlChangeAddresses,
      type: '/address/:address',
    })

    const addresses_data_receive = addresses_data_receive_data.map(
      (address) => {
        if (address.error) {
          return {
            ...address,
            coin_balance: { atoms: '0', decimal: '0' },
            locked_coin_balance: { atoms: '0', decimal: '0' },
            tokens: [],
            unused: true,
          }
        }
        return {
          ...address,
          unused: address.unused || false,
        }
      },
    )

    const addresses_data_change = addresses_data_change_data.map((address) => {
      if (address.error) {
        return {
          ...address,
          coin_balance: { atoms: '0', decimal: '0' },
          locked_coin_balance: { atoms: '0', decimal: '0' },
          tokens: [],
          unused: true,
        }
      }
      return {
        ...address,
        unused: address.unused || false,
      }
    })

    const addresses_data = [...addresses_data_receive, ...addresses_data_change]

    const first_unused_change_address_index = addresses_data_change.findIndex(
      (address_data) => {
        const { unused } = address_data
        return unused === true
      },
    )

    const first_unused_change_address =
      currentMlAddresses.mlChangeAddresses[first_unused_change_address_index]

    const first_unused_receive_address_index = addresses_data_receive.findIndex(
      (address_data) => {
        const { unused } = address_data
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
    const tokenBalances = {}
    const nftBalances = {}
    const transaction_ids = []
    const non_zero_addresses = []

    addresses_data
      .filter(({ error }) => !error)
      .forEach((address_data) => {
        const {
          coin_balance,
          locked_coin_balance,
          transaction_history,
          tokens,
        } = address_data
        available_balance = coin_balance
          ? available_balance + BigInt(coin_balance.atoms)
          : available_balance
        locked_balance = locked_coin_balance
          ? locked_balance + BigInt(locked_coin_balance.atoms)
          : locked_balance
        transaction_ids.push(...transaction_history)

        if (
          coin_balance.atoms !== '0' ||
          (tokens.length > 0 &&
            tokens.some((token) => token.amount.atoms !== '0'))
        ) {
          non_zero_addresses.push(address_data.id)
        }

        if (tokens) {
          tokens.forEach((token) => {
            const { token_id, amount } = token
            if (!tokenBalances[token_id]) {
              tokenBalances[token_id] = 0
            }
            if (amount.decimal === '1' && amount.atoms === '1') {
              nftBalances[token_id] = 1
            } else {
              tokenBalances[token_id] += Number(amount.decimal)
            }
          })
        }
      })

    const { tokensData: nftData, excludedTokenIds } =
      await Mintlayer.getNftsData(Object.keys(nftBalances))

    if (Object.keys(excludedTokenIds).length > 0) {
      Object.keys(nftBalances).forEach((tokenId) => {
        if (excludedTokenIds[tokenId]) {
          tokenBalances[tokenId] = nftBalances[tokenId]
          delete nftBalances[tokenId]
        }
      })
    }

    const mergedNftsData = Object.entries(nftData).reduce(
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

    const tokensData = await Mintlayer.getTokensData(Object.keys(tokenBalances))

    const mergedTokensData = Object.keys(tokenBalances).reduce((acc, key) => {
      if (tokensData[key] && Object.keys(tokensData[key]).length > 0) {
        acc[key] = {
          balance: tokenBalances[key],
          token_info: {
            number_of_decimals: tokensData[key].number_of_decimals,
            token_ticker: tokensData[key].token_ticker,
            token_id: key,
          },
        }
      }
      return acc
    }, {})

    const newTokenMap = {}

    const allNetworkTokensData = await Mintlayer.getAllTokensData(networkType)
    allNetworkTokensData.forEach((token) => {
      newTokenMap[token.token_id] = token.symbol || ''
    })
    setTokenMap(newTokenMap)

    setFetchingNft(false)
    setTokenBalances(mergedTokensData)
    setNftData(mergedNftsData)
    setBalance(Number(available_balance) / ML_ATOMS_PER_COIN)
    setLockedBalance(Number(locked_balance) / ML_ATOMS_PER_COIN)
    setFetchingBalances(false)
    setFetchingTokens(false)
    setCurrentAccountId(accountID)
    setAllNetworkTokensData(allNetworkTokensData)

    // fetch transactions data
    const transactions_data = await batchRequestMintlayer({
      ids: [...new Set(transaction_ids)],
      type: '/transaction/:txid',
    })

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

    const delegations = await batchRequestMintlayer({
      ids: addressList,
      type: '/address/:address/delegations',
    })

    const totalDelegationBalance = delegations.reduce(
      (acc, delegation) =>
        acc + (delegation.balance ? Number(delegation.balance.atoms) : 0),
      0,
    )

    setMlDelegationsBalance(totalDelegationBalance)
    setMlDelegationList(delegations || [])
    setFetchingDelegations(false)

    const fetchedUtxos = await batchRequestMintlayer({
      ids: non_zero_addresses,
      type: '/address/:address/all-utxos',
    })

    const fetchedSpendableUtxos = await batchRequestMintlayer({
      ids: non_zero_addresses,
      type: '/address/:address/spendable-utxos',
    })

    const parsedUtxos = fetchedUtxos

    const parsedSpendableUtxos = fetchedSpendableUtxos

    const available = parsedSpendableUtxos
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
      // .flat()
      .filter((obj) => obj.utxo.type === 'LockThenTransfer')

    const availableNftInitialUtxos = parsedSpendableUtxos.filter(
      (item) => item.utxo.type === 'IssueNft',
    )

    setNftInitialUtxos(availableNftInitialUtxos)
    setUtxos(availableUtxos)
    setLockedUtxos(lockedUtxos)

    setFetchingUtxos(false)
    setAllDataFetching(false)
  }

  const balanceLoading =
    currentAccountId !== accountID || networkType !== currentNetworkType

  // Fetch delegations
  const fetchDelegations = async (uniqueAddressesWithDelegation) => {
    try {
      if (!addresses) return
      setFetchingDelegations(true)
      const addressList = uniqueAddressesWithDelegation
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
    if (networkType !== currentNetworkType) {
      fetchAllData(true)
    }
  })

  useEffect(() => {
    Mintlayer.cancelAllRequests()
    setCurrentHeight(onlineHeight)
    const getData = async () => {
      await fetchAllData()
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
    client,
    setClient,
    InMemoryAccountProvider,
    txPreviewInfo,
    setTxPreviewInfo,
    allNetworkTokensData,
    ordersPairInfo,
    setOrdersPairInfo,
    fetchOrdersPairInfo,
    orderPairLoading,
    tokenMap,
  }

  return (
    <MintlayerContext.Provider value={propValue || value}>
      {children}
    </MintlayerContext.Provider>
  )
}

export { MintlayerContext, MintlayerProvider }
