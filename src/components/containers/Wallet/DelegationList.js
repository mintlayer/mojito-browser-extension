import { useContext } from 'react'
import Delegation from './Delegation'
import { TransactionContext } from '@Contexts'
import { SkeletonLoader } from '@BasicComponents'
import './DelegationList.css'

const DelegationList = ({ delegationsList }) => {
  const { delegationsLoading } = useContext(TransactionContext)

  const renderSkeletonLoaders = () =>
    Array.from({ length: 3 }, (_, i) => <SkeletonLoader key={i} />)

  const renderTransactions = () => {
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
      {delegationsLoading ? renderSkeletonLoaders() : renderTransactions()}
    </ul>
  )
}

export default DelegationList
