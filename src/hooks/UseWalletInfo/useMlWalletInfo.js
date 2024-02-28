import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext } from '@Contexts'

const useMlWalletInfo = (addresses) => {
  const { walletType, setTransactionsLoading, setBalanceLoading } =
    useContext(AccountContext)
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
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

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    getTransactions()
    getBalance()
  }, [getBalance, getTransactions])

  return {
    mlTransactionsList,
    mlBalance,
    mlBalanceLocked,
    mlUnformattedBalance,
    mlUnformattedBalanceLocked,
  }
}

export default useMlWalletInfo
