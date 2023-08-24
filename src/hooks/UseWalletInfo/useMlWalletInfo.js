import { useEffect, useState, useRef, useCallback } from 'react'
const ML_BALANCE_MOCK = '300,00'
const ML_TRANSACTION_LIST_MOCK = [
  {
    txid: 'e4675987639c476d7098e8b919a81f804199c527212200f531cddec06149c36e',
    date: 1687959407,
    direction: 'out',
    value: 0.0001,
    blockHeight: 2439479,
    otherPart: ['muTNbPKhgUvQ2zhjRbjUmGx1cm2gTvvbfc'],
  },
]

const useMlWalletInfo = (address) => {
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlBalance, setMlBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      console.log(address)
      const response = ML_TRANSACTION_LIST_MOCK
      setMlTransactionsList(response)
    } catch (error) {
      console.error(error)
    }
  }, [address])

  const getBalance = useCallback(async () => {
    try {
      console.log(address)
      const responce = ML_BALANCE_MOCK
      setMlBalance(responce)
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
