import Delegation from './Delegation'
import DelegationSkeleton from './DelegationSkeleton'
import styles from './DelegationList.module.css'

const DelegationList = ({ delegationsList, delegationsLoading }) => {
  const renderSkeletonLoaders = () =>
    Array.from({ length: 4 }, (_, i) => <DelegationSkeleton key={i} />)

  const renderDelegations = () => {
    if (!delegationsList || !delegationsList.length) {
      return (
        <li
          className={styles.empty}
          data-testid="delegation"
        >
          No Delegations in this wallet
        </li>
      )
    }

    const sortedDelegations = [...delegationsList].sort(
      (a, b) => (b.creation_time || 0) - (a.creation_time || 0),
    )

    return sortedDelegations.map((delegation) => (
      <Delegation
        key={
          delegation.delegation_id ||
          delegation.delegationId ||
          delegation.poolId ||
          delegation.pool_id ||
          delegation.txid
        }
        delegation={delegation}
      />
    ))
  }

  return (
    <ul
      className={styles.list}
      data-testid={'delegation-list'}
    >
      {delegationsLoading ? renderSkeletonLoaders() : renderDelegations()}
    </ul>
  )
}

export default DelegationList
