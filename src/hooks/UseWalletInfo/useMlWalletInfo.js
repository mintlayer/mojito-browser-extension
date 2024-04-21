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
  } = useContext(NetworkContext)

  return {
    mlTransactionsList,
    mlDelegationList,
    mlBalance,
    mlBalanceLocked,
    mlDelegationsBalance,
    tokenBalances,
  }
}

export default useMlWalletInfo
