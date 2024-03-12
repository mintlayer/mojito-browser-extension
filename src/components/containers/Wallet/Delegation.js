import React, { useState } from 'react'
// import { format } from 'date-fns'

import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'
import { Format } from '@Helpers'
import { PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'
import { AppInfo } from '@Constants'

import DelegationDetails from './DelegationDetails'

import './Delegation.css'

const Delegation = ({ delegation }) => {
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)
  // const date = delegation.date
  //   ? format(new Date(delegation.date * 1000), 'dd/MM/yyyy HH:mm')
  //   : 'not confirmed'

  const value = delegation.balance
    ? ML.getAmountInCoins(delegation.balance, AppInfo.ML_ATOMS_PER_COIN)
    : 0
  const formatAddress = (address) => {
    if (!address) {
      return 'Wrong address'
    }
    const limitSize = 24
    const halfLimit = limitSize / 2
    const firstPart = address.slice(0, halfLimit)
    const lastPart = address.slice(address.length - halfLimit, address.length)
    return `${firstPart}...${lastPart}`
  }

  return (
    <li
      className="transaction"
      data-testid="delegation"
      onClick={() => setDetailPopupOpen(true)}
    >
      <div
        className={'transaction-logo-type transaction-logo-out'}
        data-testid="delegation-icon"
      >
        <ArrowIcon className={'arrow-icon arrow-icon-out'} />
      </div>
      <div className="transaction-detail">
        <p
          className="transaction-id"
          data-testid="delegation-otherPart"
        >
          {delegation && formatAddress(delegation.delegation_id)}
        </p>
        <div className="transaction-date-amount">
          <p
            className="transaction-date"
            data-testid="delegation-date"
          >
            {/* TODO: update date when available from API */}
            Date: <span>12.02.2024</span>
          </p>
          <p
            className="transaction-amount"
            data-testid="delegation-amount"
          >
            Amount: <span>{delegation && Format.BTCValue(value)}</span>
          </p>
        </div>
      </div>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <DelegationDetails delegation={delegation} />
        </PopUp>
      )}
    </li>
  )
}

export default Delegation
