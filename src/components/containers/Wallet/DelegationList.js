import Delegation from './Delegation'
import { SkeletonLoader } from '@BasicComponents'
import './DelegationList.css'
import { useContext } from 'react'
import { NetworkContext } from '@Contexts'

const DelegationList = ({ delegationsList }) => {
  const { fetchingDelegations } = useContext(NetworkContext)

  const delegationsLoading = fetchingDelegations && delegationsList.length === 0

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
      className="delegation-list"
      data-testid={'delegation-list'}
    >
      {delegationsLoading ? renderSkeletonLoaders() : renderDelegations()}
    </ul>
  )
}

export default DelegationList
