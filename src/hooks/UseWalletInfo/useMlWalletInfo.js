import { useEffect, useState, useRef, useCallback } from 'react'
import { Mintlayer } from '@APIs'
import { Format } from '@Helpers'

const useMlWalletInfo = (address) => {
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlBalance, setMlBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      setMlTransactionsList([])
    } catch (error) {
      console.error(error)
    }
  }, [])

  const getBalance = useCallback(async () => {
    try {
      const balance = await Mintlayer.getAddressBalance(address)
      const formattedBalance = Format.BTCValue(balance.balanceInTokens)
      if (balance) setMlBalance(formattedBalance)
      else setMlBalance(0)
    } catch (error) {
      console.error(error)
    }
  }, [address])

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
