import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext, TransactionContext } from '@Contexts'

const useMlWalletInfo = (addresses) => {
  // const isWalletPage = location.pathname === '/wallet'
  const { walletType, setBalanceLoading } = useContext(AccountContext)
  const { setTransactionsLoading, setDelegationsLoading } =
    useContext(TransactionContext)
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)
  const [mlBalance, setMlBalance] = useState(0)
  const [mlBalanceLocked, setMlBalanceLocked] = useState(0)
  const [mlUnformattedBalance, setMlUnformattedBalance] = useState(0)
  const [mlUnformattedBalanceLocked, setMlUnformattedBalanceLocked] =
    useState(0)
  const isMintlayer = walletType.name === 'Mintlayer'

  const getTransactions = useCallback(async () => {
    try {
      if (!addresses || !isMintlayer) return
      setTransactionsLoading(true)
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const transactions = await Mintlayer.getWalletTransactions(addressList)

      const parsedTransactions = ML.getParsedTransactions(
        transactions,
        addressList,
      )
      setMlTransactionsList(parsedTransactions)
      setTransactionsLoading(false)
    } catch (error) {
      console.error(error)
      setTransactionsLoading(false)
    }
  }, [addresses, setTransactionsLoading, isMintlayer])

  const getBalance = useCallback(async () => {
    try {
      if (!addresses) return
      setBalanceLoading(true)
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]

      const balanceResult = await Mintlayer.getWalletBalance(addressList)

      const balance = balanceResult.totalBalance
      const balanceLocked = balanceResult.lockedBalance
      const balanceInCoins = ML.getAmountInCoins(balance.balanceInAtoms)
      const balanceLockedInCoins = ML.getAmountInCoins(
        balanceLocked.balanceInAtoms,
      )
      const formattedBalance = Format.BTCValue(balanceInCoins)
      const formattedBalanceLocked = Format.BTCValue(balanceLockedInCoins)

      if (balance) {
        setMlBalance(formattedBalance)
        setMlUnformattedBalance(balance)
      } else setMlBalance(0)

      if (balanceLocked) {
        setMlBalanceLocked(formattedBalanceLocked)
        setMlUnformattedBalanceLocked(formattedBalanceLocked)
      } else setMlBalanceLocked(0)
      setBalanceLoading(false)
    } catch (error) {
      console.error(error)
      setMlBalance(0)
      setBalanceLoading(false)
      return
    }
  }, [addresses, setBalanceLoading])

  const getDelegations = useCallback(async () => {
    try {
      if (!addresses || !isMintlayer) return
      if (mlDelegationList.length === 0) {
        setDelegationsLoading(true)
      }
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
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
      setDelegationsLoading(false)
    } catch (error) {
      console.error(error)
      setDelegationsLoading(false)
    }
  }, [addresses, setDelegationsLoading, isMintlayer, mlDelegationList])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    // getTransactions()
    // getDelegations()
    // getBalance()
  }, [getBalance, getTransactions, getDelegations])

  return {
    mlTransactionsList,
    mlDelegationList,
    mlBalance,
    mlBalanceLocked,
    mlUnformattedBalance,
    mlUnformattedBalanceLocked,
    mlDelegationsBalance,
    getDelegations,
    getTransactions,
    getBalance,
  }
}

export default useMlWalletInfo
