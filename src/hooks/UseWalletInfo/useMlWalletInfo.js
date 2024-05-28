import { useContext } from 'react'
import { NetworkContext } from '@Contexts'

const useMlWalletInfo = (addresses, token) => {
  const {
    balance,
    lockedBalance,
    transactions,
    tokenBalances,
    mlDelegationList,
    mlDelegationsBalance,
    utxos,
    fetchAllData,
    fetchDelegations,
    unusedAddresses,
    feerate,
    currentHeight,

    fetchingBalances,
    fetchingUtxos,
    fetchingTransactions,
    fetchingDelegations,
  } = useContext(NetworkContext)

  // const nativecoins
  const nativecoins = ['Mintlayer', 'Bitcoin']

  if (token && !nativecoins.includes(token)) {
    const tokenBalance = tokenBalances[token].balance || 0

    return {
      transactions: transactions.filter((tx) => tx.token_id === token),
      balance: tokenBalance,
      utxos,
      unusedAddresses,
      feerate,
      tokenBalances,
    }
  }

  return {
    transactions: transactions.filter((tx) => tx.token_id === undefined),
    mlDelegationList,
    balance,
    lockedBalance,
    mlDelegationsBalance,
    tokenBalances,
    utxos,
    fetchAllData,
    fetchDelegations,
    unusedAddresses,
    feerate,
    currentHeight,

    fetchingBalances,
    fetchingUtxos,
    fetchingTransactions,
    fetchingDelegations,
  }
}

export default useMlWalletInfo
