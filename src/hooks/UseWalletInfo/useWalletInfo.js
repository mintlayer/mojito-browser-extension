import { useEffect, useState, useRef, useCallback } from 'react'

import { Electrum } from '@APIs'
import { BTC, Format } from '@Helpers'

const useWalletInfo = (addresses) => {
  const effectCalled = useRef(false)
  const [transactionsList, setTransactionsList] = useState([])
  const [balance, setBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      const transactions = await addresses.reduce(async (acc, address) => {
        const response = await Electrum.getAddressTransactions(address)
        const transactions = JSON.parse(response)
        const parsedTransactions = BTC.getParsedTransactions(
          transactions,
          address,
        )

        acc.push(...parsedTransactions)
        return acc
      }, [])

      setTransactionsList(transactions)
    } catch (error) {
      console.error(error)
    }
  }, [addresses])

  const getBalance = useCallback(async () => {
    try {
      const balance = await addresses.reduce(async (oldBalance, address) => {
        const utxos = await Electrum.getAddressUtxo(address)
        const satoshiBalance = BTC.calculateBalanceFromUtxoList(
          JSON.parse(utxos),
        )
        return oldBalance + satoshiBalance
      }, 0)

      const balanceConvertedToBTC = BTC.convertSatoshiToBtc(balance)
      const formattedBalance = Format.BTCValue(balanceConvertedToBTC)
      setBalance(formattedBalance)
    } catch (error) {
      console.error(error)
    }
  }, [addresses])

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
