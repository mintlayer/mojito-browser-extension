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
  }
}

export default useMlWalletInfo
