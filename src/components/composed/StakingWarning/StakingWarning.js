import { useMlWalletInfo } from '@Hooks'
import './StakingWarning.css'
import React from 'react'

const StakingWarning = ({ addressList }) => {
  const { mlDelegationList } = useMlWalletInfo(addressList)

  if (!mlDelegationList) {
    return null
  }

  if (mlDelegationList.length === 0) {
    return null
  }

  const decommissionedPools = mlDelegationList.filter(
    (delegation) => delegation.decommissioned && delegation.balance.length > 11,
  )

  if (decommissionedPools.length === 0) {
    return null
  }

  return (
    <div className="staking-warning">
      <div
        className="warning-icon"
        title="you delegatied to inactive pool"
      >
        !
      </div>
    </div>
  )
}

export default StakingWarning
