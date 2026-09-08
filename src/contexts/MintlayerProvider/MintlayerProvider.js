import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Decimal from 'decimal.js'

import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'
import { Mintlayer } from '@APIs'
import { LocalStorageService } from '@Storage'

const MintlayerContext = createContext()

class InMemoryAccountProvider {
  constructor(addresses, navigate) {
    this.addresses = addresses
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
    if (method === 'signTransaction') {
      const { txData } = params
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
  const currentMlAddresses = addresses.mlAddresses
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
  const [addressData, setAddressData] = useState([])

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
  const [fetchError, setFetchError] = useState(null)
  // Ref-based mutex: state updates are async, so two overlapping effects
  // could both pass an allDataFetching state guard and interleave runs.
  const fetchAllDataRunningRef = useRef(false)
  const fetchAllDataPromiseRef = useRef(null)

  const fetchOrdersPairInfo = async (orderPair, amount) => {
    setOrderPairLoading(true)
    try {
      return await fetchOrdersPairInfoInner(orderPair, amount)
    } catch (error) {
      console.error('Failed to fetch orders pair info:', error)
      setOrdersPairInfo([])
      return []
    } finally {
      setOrderPairLoading(false)
    }
  }

  const fetchOrdersPairInfoInner = async (orderPair, amount) => {
    const coinTicker =
      networkType === AppInfo.NETWORK_TYPES.TESTNET ? 'TML' : 'ML'
    const swapPairsCurrency = orderPair.split('_')
    const minAskBalance = Number(amount) || 0
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
          Number(order.ask_balance.decimal) >= minAskBalance
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

  const runFetchAllData = async () => {
    try {
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
        return
      }

      setCurrentNetworkType(networkType)
      setCurrentHeight(onlineHeight)

      const addresses_data_receive_data = await ML.getBatchData(
        currentMlAddresses.mlReceivingAddresses,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_DATA,
      )
      const addresses_data_change_data = await ML.getBatchData(
        currentMlAddresses.mlChangeAddresses,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_DATA,
      )

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

      const addresses_data_change = addresses_data_change_data.map(
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

      const addresses_data = [
        ...addresses_data_receive,
        ...addresses_data_change,
      ]
      setAddressData(addresses_data)

      const first_unused_change_address_index = addresses_data_change.findIndex(
        (address_data) => {
          const { unused } = address_data
          return unused === true
        },
      )

      const first_unused_change_address =
        currentMlAddresses.mlChangeAddresses[
          first_unused_change_address_index
        ] || currentMlAddresses.mlChangeAddresses[0]

      const first_unused_receive_address_index =
        addresses_data_receive.findIndex((address_data) => {
          const { unused } = address_data
          return unused === true
        })

      const first_unused_receive_address =
        currentMlAddresses.mlReceivingAddresses[
          first_unused_receive_address_index
        ] || currentMlAddresses.mlReceivingAddresses[0]

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
      const locked_addresses = []

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

          if (locked_coin_balance && locked_coin_balance.atoms !== '0') {
            locked_addresses.push(address_data.id)
          }

          if (tokens) {
            tokens.forEach((token) => {
              const { token_id, amount } = token
              if (amount.decimal === '1' && amount.atoms === '1') {
                nftBalances[token_id] = 1
              } else {
                // Decimal accumulation: float += on decimal strings drifts.
                tokenBalances[token_id] = tokenBalances[token_id]
                  ? tokenBalances[token_id].plus(amount.decimal)
                  : new Decimal(amount.decimal)
              }
            })
          }
        })

      const { tokensData: nftData, excludedTokenIds } =
        await Mintlayer.getNftsData(Object.keys(nftBalances))

      if (Object.keys(excludedTokenIds).length > 0) {
        Object.keys(nftBalances).forEach((tokenId) => {
          if (excludedTokenIds[tokenId]) {
            tokenBalances[tokenId] = new Decimal(nftBalances[tokenId])
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

      const tokensData = await Mintlayer.getTokensData(
        Object.keys(tokenBalances),
      )

      const mergedTokensDataEntries = await Promise.all(
        Object.keys(tokenBalances).map(async (key) => {
          if (!(tokensData[key] && Object.keys(tokensData[key]).length > 0)) {
            return null
          }

          // Tokens have no on-chain icon: resolve it from the metadata
          // document (cached, non-fatal — no icon means the fallback tile).
          const iconUri = await Mintlayer.resolveTokenIcon(
            tokensData[key].metadata_uri?.string,
          ).catch(() => undefined)

          return [
            key,
            {
              balance: tokenBalances[key].toNumber(),
              token_info: {
                number_of_decimals: tokensData[key].number_of_decimals,
                token_ticker: tokensData[key].token_ticker,
                token_id: key,
                // { string } keeps the same shape the UI already reads
                // (token_info.icon_uri.string).
                ...(iconUri ? { icon_uri: { string: iconUri } } : {}),
              },
            },
          ]
        }),
      )

      const mergedTokensData = Object.fromEntries(
        mergedTokensDataEntries.filter(Boolean),
      )

      const newTokenMap = {}

      const allNetworkTokensData = await Mintlayer.getAllTokensData(networkType)
      allNetworkTokensData.forEach((token) => {
        newTokenMap[token.token_id] = token.symbol || ''
      })
      setTokenMap(newTokenMap)

      setFetchingNft(false)
      setTokenBalances(mergedTokensData)
      setNftData(mergedNftsData)
      // Decimal division from the BigInt atom totals: Number(bigint) alone
      // loses precision above 2^53 atoms (~900 ML at 11 decimals).
      setBalance(
        new Decimal(available_balance.toString())
          .dividedBy(AppInfo.ML_ATOMS_PER_COIN)
          .toNumber(),
      )
      setLockedBalance(
        new Decimal(locked_balance.toString())
          .dividedBy(AppInfo.ML_ATOMS_PER_COIN)
          .toNumber(),
      )
      setFetchingBalances(false)
      setFetchingTokens(false)
      setCurrentAccountId(accountID)
      setAllNetworkTokensData(allNetworkTokensData)

      // fetch transactions data
      const transactions_data = await ML.getBatchData(
        [...new Set(transaction_ids)],
        Mintlayer.MINTLAYER_ENDPOINTS.GET_TRANSACTION_DATA,
      )

      const parsedTransactions = ML.getParsedTransactions(
        transactions_data,
        addressList,
      )
      setTransactions(parsedTransactions)
      setFetchingTransactions(false)

      // fetch utxos
      const accountName = account && account.name
      const unconfirmedTransactionString = ML.getUnconfirmedTransactionKey(
        accountName,
        networkType,
      )
      const unconfirmedTransactions =
        LocalStorageService.getItem(unconfirmedTransactionString) || []

      const fetchedSpendableUtxos = await ML.getBatchData(
        non_zero_addresses,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_SPENDABLE_UTXO,
      )

      const available = fetchedSpendableUtxos
        .filter((item) => item.utxo?.value)
        .filter((item) => item.utxo.type !== 'Htlc') // Do not try to spend non-external
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

      const fetchedLockedUtxos =
        locked_addresses.length > 0
          ? await ML.getBatchData(
              locked_addresses,
              Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_UTXO,
            )
          : []
      const lockedUtxos = fetchedLockedUtxos.filter(
        (obj) => obj.utxo.type === 'LockThenTransfer',
      )

      const availableNftInitialUtxos = fetchedSpendableUtxos.filter(
        (item) => item.utxo?.type === 'IssueNft',
      )

      setNftInitialUtxos(availableNftInitialUtxos)
      setUtxos(availableUtxos)
      setLockedUtxos(lockedUtxos)
    } catch (error) {
      // Never leave the UI wedged: surface the error and let `finally`
      // release every loading flag so the next poll can retry.
      console.error('fetchAllData failed:', error)
      setFetchError(error)
    } finally {
      setAllDataFetching(false)
      setFetchingTransactions(false)
      setFetchingBalances(false)
      setFetchingUtxos(false)
      setFetchingTokens(false)
      setFetchingNft(false)
    }
  }

  const fetchAllData = async (force) => {
    // Dedupe concurrent non-forced calls; serialize forced calls after the
    // in-flight run so a network switch can never interleave two runs.
    if (fetchAllDataRunningRef.current && !force) return
    while (fetchAllDataRunningRef.current && fetchAllDataPromiseRef.current) {
      await fetchAllDataPromiseRef.current.catch(() => {})
    }
    fetchAllDataRunningRef.current = true
    fetchAllDataPromiseRef.current = runFetchAllData().finally(() => {
      fetchAllDataRunningRef.current = false
      fetchAllDataPromiseRef.current = null
    })
    return fetchAllDataPromiseRef.current
  }

  const balanceLoading =
    currentAccountId !== accountID || networkType !== currentNetworkType

  // Fetch delegations
  const fetchDelegations = async () => {
    try {
      if (!addresses) return
      const addressList = currentMlAddresses
        ? [
            ...currentMlAddresses.mlReceivingAddresses,
            ...currentMlAddresses.mlChangeAddresses,
          ]
        : []
      const allDelegations = await ML.getBatchData(
        addressList,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_ADDRESS_DELEGATIONS,
      )
      const delegations = [
        ...new Map(allDelegations.map((d) => [d.delegation_id, d])).values(),
      ]
      const delegationList = delegations.map(
        (delegation) => delegation.delegation_id,
      )
      const delegation_details = await ML.getBatchData(
        delegationList,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_DELEGATION,
      )
      const blocksList = delegation_details.map(
        (delegation) => delegation.creation_block_height,
      )
      const block_hashes = await ML.getBatchData(
        blocksList,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_BLOCK_HASH,
      )
      const blocks_data = await ML.getBatchData(
        block_hashes,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_BLOCK_DATA,
      )

      const pools = delegation_details.map((delegation) => delegation.pool_id)

      const uniquePools = [...new Set(pools)]

      const pools_data = await ML.getBatchData(
        uniquePools,
        Mintlayer.MINTLAYER_ENDPOINTS.GET_POOL_DATA,
      )

      const emptyPoolsDataMap = uniquePools.reduce((acc, pool, index) => {
        if (pools_data[index]?.staker_balance?.atoms === '0') {
          acc[pool] = pools_data[index]
        }
        return acc
      }, {})

      const mergedDelegations = delegations.map((delegation, index) => {
        return {
          ...delegation,
          decommissioned: emptyPoolsDataMap[delegation.pool_id] ? true : false,
          balance: delegation.balance,
          creation_block_height:
            delegation_details[index].creation_block_height,
          creation_time: blocks_data.find(
            ({ height }) =>
              height === delegation_details[index]?.creation_block_height,
          ).header.timestamp.timestamp,
        }
      })

      const unconfirmedTransactionString = ML.getUnconfirmedTransactionKey(
        accountName,
        networkType,
      )
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

      const totalDelegationBalance = mergedDelegations
        .reduce(
          (acc, delegation) => acc.plus(delegation.balance?.decimal || 0),
          new Decimal(0),
        )
        .toNumber()
      setMlDelegationsBalance(totalDelegationBalance)
      setMlDelegationList(mergedDelegations)
    } catch (error) {
      console.error(error)
      setMlDelegationsBalance(0)
      setMlDelegationList([])
    } finally {
      // Always release the flag — including the `!addresses` early return.
      setFetchingDelegations(false)
    }
  }

  useEffect(() => {
    if (networkType !== currentNetworkType) {
      // Supersede any in-flight requests started for the old network.
      Mintlayer.cancelAllRequests()
      setOrdersPairInfo([])
      setMlDelegationList([])
      setMlDelegationsBalance(0)
      fetchAllData(true)
      fetchDelegations(addresses)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkType, currentNetworkType, addresses])

  useEffect(() => {
    setOrdersPairInfo([])
    setMlDelegationList([])
    setMlDelegationsBalance(0)
  }, [accountID])

  useEffect(() => {
    // No cancelAllRequests() here: it would abort requests the network
    // effect just started; fetchAllData's own mutex serializes runs.
    setCurrentHeight(onlineHeight)
    const getData = async () => {
      await fetchAllData()
      await fetchDelegations(addresses)
    }
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineHeight, accountID, networkType])

  useEffect(() => {
    const getData = async () => {
      try {
        const result = await Mintlayer.getChainTip()
        const { block_height } = JSON.parse(result)
        setOnlineHeight(block_height)
      } catch (error) {
        // Transient node outages must not produce unhandled rejections.
        console.error('Failed to fetch chain tip:', error)
      }
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
    addressData,

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
    fetchError,
  }

  return (
    <MintlayerContext.Provider value={propValue || value}>
      {children}
    </MintlayerContext.Provider>
  )
}

export { MintlayerContext, MintlayerProvider }
