import { useMlWalletInfo } from '@Hooks'
import './StakingWarning.css'
import React from 'react'

const MIN_DELEGATION_BALANCE = 1

const StakingWarning = () => {
  const { mlDelegationList } = useMlWalletInfo()

  if (!mlDelegationList) {
    return null
  }

  if (mlDelegationList.length === 0) {
    return null
  }

  const decommissionedPools = mlDelegationList.filter(
    (delegation) =>
      delegation.decommissioned &&
      Number(delegation.balance?.decimal ?? 0) >= MIN_DELEGATION_BALANCE,
  )

  if (decommissionedPools.length === 0) {
    return null
  }

  return (
    <div className="staking-warning">
      <div
        className="warning-icon"
        title="You delegated to an inactive pool"
      >
        !
      </div>
    </div>
  )
}

export default StakingWarning
