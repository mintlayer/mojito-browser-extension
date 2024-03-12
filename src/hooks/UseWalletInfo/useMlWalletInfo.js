import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext, TransactionContext } from '@Contexts'
import { useLocation } from 'react-router-dom'

const useMlWalletInfo = (addresses) => {
  const location = useLocation()
  const isWalletPage = location.pathname === '/wallet'
  const isStakingPage = location.pathname === '/staking'
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
      if (!addresses || !isMintlayer || !isWalletPage) return
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
  }, [addresses, setTransactionsLoading, isMintlayer, isWalletPage])

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
      // console.log(addressList, 'addressListDelegation')
      const delegations = await Mintlayer.getWalletDelegations(addressList)
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
  }, [addresses, setDelegationsLoading, isMintlayer, isStakingPage])

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
  }
}

export default useMlWalletInfo
