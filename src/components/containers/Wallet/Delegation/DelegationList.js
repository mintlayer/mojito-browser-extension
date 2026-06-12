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

    delegationsList.sort((a, b) => b.creation_time - a.creation_time)

    return delegationsList.map((delegation, index) => (
      <Delegation
        key={index}
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
