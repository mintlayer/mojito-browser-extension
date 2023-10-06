import { useEffect, useState, useRef, useCallback } from 'react'

import { Electrum } from '@APIs'
import { BTC, Format } from '@Helpers'

const useBtcWalletInfo = (address) => {
  const effectCalled = useRef(false)
  const [btcTransactionsList, setBtcTransactionsList] = useState([])
  const [btcBalance, setBtcBalance] = useState(0)

  const getTransactions = useCallback(async () => {
    try {
      if (!address) return ''
      const response = await Electrum.getAddressTransactions(address)
      const transactions = JSON.parse(response)
      const parsedTransactions = BTC.getParsedTransactions(
        transactions,
        address,
      )
      setBtcTransactionsList(parsedTransactions)
    } catch (error) {
      console.error(error)
    }
  }, [address])

  const getBalance = useCallback(async () => {
    try {
      if (!address) return ''
      const utxos = await Electrum.getAddressUtxo(address)
      const satoshiBalance = BTC.calculateBalanceFromUtxoList(JSON.parse(utxos))
      const balanceConvertedToBTC = BTC.convertSatoshiToBtc(satoshiBalance)
      const formattedBalance = Format.BTCValue(balanceConvertedToBTC)
      setBtcBalance(formattedBalance)
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

  return { btcTransactionsList, btcBalance }
}

export default useBtcWalletInfo
