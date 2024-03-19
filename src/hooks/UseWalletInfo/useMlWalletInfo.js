import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext, TransactionContext, SettingsContext } from '@Contexts'
import { useLocation } from 'react-router-dom'
import { LocalStorageService } from '@Storage'

const useMlWalletInfo = (addresses, revalidate) => {
  const location = useLocation()
  // const isWalletPage = location.pathname === '/wallet'
  const isStakingPage = location.pathname === '/staking'
  const { walletType, setBalanceLoading } = useContext(AccountContext)
  const { setTransactionsLoading, setDelegationsLoading } =
    useContext(TransactionContext)
  const { networkType } = useContext(SettingsContext)
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
      if (!addresses || !isMintlayer || !isStakingPage) return
      setDelegationsLoading(true)
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const delegations = await Mintlayer.getWalletDelegations(addressList)

      //TODO remove this after API provide the timestamp
      const account = LocalStorageService.getItem('unlockedAccount')
      const accountName = account.name
      const lastDelegationIdString = `${'lastDelegationId'}_${accountName}_${networkType}`
      const lastDelegationPoolID = LocalStorageService.getItem(
        lastDelegationIdString,
      )
      const specifiedDelegationIndex = delegations.findIndex(
        (delegation) => delegation.pool_id === lastDelegationPoolID,
      )
      const specifiedDelegation = delegations.splice(
        specifiedDelegationIndex,
        1,
      )[0]
      delegations.unshift(specifiedDelegation)
      //----------------------------------------------

      const totalDelegationBalance = delegations.reduce(
        (acc, delegation) => acc + Number(delegation.balance),
        0,
      )
      setMlDelegationsBalance(totalDelegationBalance)
      setMlDelegationList(delegations)
      setDelegationsLoading(false)
    } catch (error) {
      console.error(error)
      setDelegationsLoading(false)
    }
  }, [
    addresses,
    setDelegationsLoading,
    isMintlayer,
    isStakingPage,
    networkType,
  ])

  useEffect(() => {
    if (isStakingPage && revalidate) {
      getTransactions()
      getDelegations()
      const delegЕimer = setInterval(getDelegations, 30000)
      const transTimer = setInterval(getTransactions, 30000)
      return () => {
        clearInterval(delegЕimer)
        clearInterval(transTimer)
      }
    }
    return
  }, [getDelegations, getBalance, getTransactions, isStakingPage, revalidate])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    getTransactions()
    getDelegations()
    getBalance()
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
  }
}

export default useMlWalletInfo
