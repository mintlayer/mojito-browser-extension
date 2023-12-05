import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { Format, ML } from '@Helpers'
import { AccountContext } from '@Contexts'

const useMlWalletInfo = (addresses) => {
  const { setWalletDataLoading } = useContext(AccountContext)
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlBalance, setMlBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      if (!addresses) return
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const transactions = await Mintlayer.getWalletTransactions(addressList)
      const parsedTransactions = ML.getParsedTransactions(transactions)
      setMlTransactionsList(parsedTransactions)
    } catch (error) {
      console.error(error)
    }
  }, [addresses])

  const getBalance = useCallback(async () => {
    try {
      if (!addresses) return
      setWalletDataLoading(true)
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const balance = await Mintlayer.getWalletBalance(addressList)

      const formattedBalance = Format.BTCValue(balance.balanceInCoins)

      if (balance) setMlBalance(formattedBalance)
      else setMlBalance(0)
      setWalletDataLoading(false)
    } catch (error) {
      console.error(error)
      setMlBalance(0)
      setWalletDataLoading(false)
      return
    }
  }, [addresses, setWalletDataLoading])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    getTransactions()
    getBalance()
  }, [getBalance, getTransactions])

  return { mlTransactionsList, mlBalance }
}

export default useMlWalletInfo
