import { useContext } from 'react'
import { BitcoinContext } from '@Contexts'

const useBtcWalletInfo = (address) => {
  const {
    btcBalance,
    btcTransactions,
    btcUtxos,
    currentBlockHeight,
    fetchingBalances,
    fetchingTransactions,
    fetchingUtxos,
    setFetchingBalances,
    setFetchingTransactions,
    setFetchingUtxos,
  } = useContext(BitcoinContext)

  return {
    transactions: btcTransactions,
    balance: btcBalance,
    utxos: btcUtxos,
    currentBlockHeight,
    fetchingBalances,
    fetchingTransactions,
    fetchingUtxos,
    setFetchingBalances,
    setFetchingTransactions,
    setFetchingUtxos,
  }
}

export default useBtcWalletInfo
