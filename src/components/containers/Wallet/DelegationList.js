import { useContext } from 'react'
import Delegation from './Delegation'
import { TransactionContext, AccountContext, SettingsContext } from '@Contexts'
import { SkeletonLoader } from '@BasicComponents'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'
import './DelegationList.css'

const DelegationList = ({ delegationsList }) => {
  const { accountName } = useContext(AccountContext)
  const { delegationsLoading } = useContext(TransactionContext)
  const { networkType } = useContext(SettingsContext)

  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const unconfirmedTransactions = LocalStorageService.getItem(
    unconfirmedTransactionString,
  )

  const isUncofermedTransactionInList =
    unconfirmedTransactions &&
    delegationsList.some(
      (delegation) => delegation.txid === unconfirmedTransactions.txid,
    )

  if (unconfirmedTransactions && !isUncofermedTransactionInList) {
    delegationsList.unshift(unconfirmedTransactions)
  }

  const renderSkeletonLoaders = () =>
    Array.from({ length: 3 }, (_, i) => <SkeletonLoader key={i} />)

  const renderDelegations = () => {
    if (!delegationsList || !delegationsList.length) {
      return (
        <li
          className="empty-list"
          data-testid="delegation"
        >
          No Delegations in this wallet
        </li>
      )
    }

    return delegationsList.map((delegation, index) => (
      <Delegation
        key={index}
        delegation={delegation}
      />
    ))
  }

  return (
    <ul
      className="delegation-list"
      data-testid={'delegation-list'}
    >
      {delegationsLoading ? renderSkeletonLoaders() : renderDelegations()}
    </ul>
  )
}

export default DelegationList
