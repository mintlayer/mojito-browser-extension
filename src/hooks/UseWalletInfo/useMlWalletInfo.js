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
  } = useContext(NetworkContext)

  // const nativecoins
  const nativecoins = ['Mintlayer', 'Bitcoin']
  console.log(token)

  if (token && !nativecoins.includes(token)) {
    console.log('tokenBalances', tokenBalances)
    const tokenBalance = tokenBalances[token].balance || 0

    return {
      transactions: [],
      balance: tokenBalance,
      utxos,
      unusedAddresses,
      feerate,
    }
  }

  return {
    transactions,
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
  }
}

export default useMlWalletInfo
