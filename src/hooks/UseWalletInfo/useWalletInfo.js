import { useEffect, useState, useRef, useCallback } from 'react'

import { Electrum } from '@APIs'
import { BTC, Format } from '@Helpers'

const useWalletInfo = (address) => {
  const effectCalled = useRef(false)
  const [transactionsList, setTransactionsList] = useState([])
  const [balance, setBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      const response = await Electrum.getAddressTransactions(address)
      const transactions = JSON.parse(response)
      const parsedTransactions = BTC.getParsedTransactions(
        transactions,
        address,
      )
      setTransactionsList(parsedTransactions)
    } catch (error) {
      console.error(error)
    }
  }, [address])

  const getBalance = useCallback(async () => {
    try {
      const utxos = await Electrum.getAddressUtxo(address)
      const satoshiBalance = BTC.calculateBalanceFromUtxoList(JSON.parse(utxos))
      const balanceConvertedToBTC = BTC.convertSatoshiToBtc(satoshiBalance)
      const formattedBalance = Format.BTCValue(balanceConvertedToBTC)
      setBalance(formattedBalance)
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

  return { transactionsList, balance }
}

export default useWalletInfo
