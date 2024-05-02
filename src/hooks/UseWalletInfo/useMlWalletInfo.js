import { useContext } from 'react'
import { NetworkContext } from '@Contexts'

const useMlWalletInfo = (addresses) => {
  const {
    balance: mlBalance,
    lockedBalance: mlBalanceLocked,
    transactions: mlTransactionsList,
    tokenBalances,
    mlDelegationList,
    mlDelegationsBalance,
    utxos,
    fetchAllData,
    fetchDelegations,
    unusedAddresses,
    feerate,
  } = useContext(NetworkContext)

  return {
    mlTransactionsList,
    mlDelegationList,
    mlBalance,
    mlBalanceLocked,
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
