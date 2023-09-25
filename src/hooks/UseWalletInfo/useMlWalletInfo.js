import { useEffect, useState, useRef, useCallback } from 'react'
// import { Mintlayer } from '@APIs'

// TODO - remove when API is ready
const ML_BALANCE_MOCK = '0,00'
const ML_TRANSACTION_LIST_MOCK = []

const useMlWalletInfo = (address) => {
  const effectCalled = useRef(false)
  const [mlTransactionsList, setMlTransactionsList] = useState([])
  const [mlBalance, setMlBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      // TODO - uncomment when API is ready

      // const response = await Mintlayer.getAddressTransactions(address)
      // const transactions = JSON.parse(response)
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

      // TODO - uncomment when API is ready

      // const utxos = await Mintlayer.getAddressUtxo(address)
      // const satoshiBalance = BTC.calculateBalanceFromUtxoList(JSON.parse(utxos))
      // const balanceConvertedToBTC = BTC.convertSatoshiToBtc(satoshiBalance)
      // const formattedBalance = Format.BTCValue(balanceConvertedToBTC)

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
