import { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { Mintlayer } from '@APIs'
import { AccountContext, NetworkContext, TransactionContext } from '@Contexts'

const useMlWalletInfo = (addresses) => {
  // const isWalletPage = location.pathname === '/wallet'
  const { walletType } = useContext(AccountContext)
  const { setDelegationsLoading } = useContext(TransactionContext)
  const {
    balance: mlBalance,
    lockedBalance: mlBalanceLocked,
    transactions: mlTransactionsList,
  } = useContext(NetworkContext)
  const effectCalled = useRef(false)
  const [mlDelegationList, setMlDelegationList] = useState([])
  const [mlDelegationsBalance, setMlDelegationsBalance] = useState(0)
  const isMintlayer = walletType.name === 'Mintlayer'

  const getDelegations = useCallback(async () => {
    try {
      if (!addresses || !isMintlayer) return
      if (mlDelegationList.length === 0) {
        setDelegationsLoading(true)
      }
      const addressList = [
        ...addresses.mlReceivingAddresses,
        ...addresses.mlChangeAddresses,
      ]
      const delegations = await Mintlayer.getWalletDelegations(addressList)
      const delegation_details = await Mintlayer.getDelegationDetails(
        delegations.map((delegation) => delegation.delegation_id),
      )
      const blocks_data = await Mintlayer.getBlocksData(
        delegation_details.map(
          (delegation) => delegation.creation_block_height,
        ),
      )

      const mergedDelegations = delegations.map((delegation, index) => {
        return {
          ...delegation,
          balance: delegation.balance.atoms,
          creation_block_height:
            delegation_details[index].creation_block_height,
          creation_time: blocks_data.find(
            ({ height }) =>
              height === delegation_details[index].creation_block_height,
          ).header.timestamp.timestamp,
        }
      })

      const totalDelegationBalance = mergedDelegations.reduce(
        (acc, delegation) => acc + Number(delegation.balance),
        0,
      )
      setMlDelegationsBalance(totalDelegationBalance)
      setMlDelegationList(mergedDelegations)
      setDelegationsLoading(false)
    } catch (error) {
      console.error(error)
      setDelegationsLoading(false)
    }
  }, [addresses, setDelegationsLoading, isMintlayer, mlDelegationList])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    // getTransactions()
    // getDelegations()
    // getBalance()
  }, [getDelegations])

  return {
    mlTransactionsList,
    mlDelegationList,
    mlBalance,
    mlBalanceLocked,
    mlDelegationsBalance,
    getDelegations,
  }
}

export default useMlWalletInfo
