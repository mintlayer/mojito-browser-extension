import React, { useState } from 'react'
import { format } from 'date-fns'

import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'
import { ReactComponent as LoopIcon } from '@Assets/images/icon-loop.svg'
import { ReactComponent as StakeIcon } from '@Assets/images/icon-stake.svg'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'
import { ReactComponent as UnconfirmedIcon } from '@Assets/images/icon-sand.svg'
import { Format } from '@Helpers'
import { PopUp } from '@ComposedComponents'
import { useNavigate } from 'react-router-dom'

import TransactionDetails from './TransactionDetails'

import './Transaction.css'

const Info = ({ transaction }) => {
  const navigate = useNavigate()
  return (
    <li
      className="transaction"
      data-testid="transaction"
      onClick={() => navigate('/settings')}
    >
      <div
        className="transaction-logo-type transaction-logo-type-info"
        data-testid="transaction-icon"
      >
        !
      </div>
      <div className="transaction-detail">
        <p
          className="transaction-id-info"
          data-testid="transaction-otherPart"
        >
          {transaction.otherPart && transaction.otherPart}
        </p>
      </div>
    </li>
  )
}

const Transaction = ({ transaction, getConfirmations }) => {
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)
  const date = transaction.date
    ? format(new Date(transaction.date * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'
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

  return transaction.direction === 'info' ? (
    <Info transaction={transaction} />
  ) : (
    <li
      className="transaction"
      data-testid="transaction"
      onClick={() => setDetailPopupOpen(true)}
    >
      {transaction.type === 'Transfer' || !transaction.type ? (
        <div
          className={`transaction-logo-type ${
            transaction.direction === 'out' && 'transaction-logo-out'
          }`}
          data-testid="transaction-icon"
        >
          <ArrowIcon
            className={`arrow-icon ${
              transaction.direction === 'out' && 'arrow-icon-out'
            }`}
          />
        </div>
      ) : (
        <></>
      )}
      {transaction.sameWalletTransaction ? (
        <div
          className="transaction-logo-type transaction-logo-type-same"
          data-testid="transaction-icon"
        >
          <LoopIcon className="loop-icon" />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'Unconfirmed' ? (
        <div
          className="transaction-logo-type transaction-logo-type-unconfirmed"
          data-testid="transaction-icon"
        >
          <UnconfirmedIcon className="unconfirmed-icon" />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'CreateStakePool' ? (
        <div
          className="transaction-logo-type transaction-logo-type-stake transaction-logo-type-stake"
          data-testid="transaction-icon"
        >
          <StakeIcon className="stake-icon" />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'CreateDelegationId' ? (
        <div
          className="transaction-logo-type transaction-logo-type-stake transaction-logo-type-stake"
          data-testid="transaction-icon"
        >
          <StakeIcon className="stake-icon" />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'DelegateStaking' ? (
        <div
          className="transaction-logo-type transaction-logo-type-delegate transaction-logo-type-stake"
          data-testid="transaction-icon"
        >
          <DelegationIcon className="delegation-icon" />
        </div>
      ) : (
        <></>
      )}
      <div className="transaction-detail">
        <p
          className="transaction-id"
          data-testid="transaction-otherPart"
        >
          {transaction.otherPart && formatAddress(transaction.otherPart[0])}
          {transaction.otherPart &&
            [...new Set(transaction.otherPart)].length > 1 &&
            ` (+${transaction.otherPart.length - 1})`}
          {transaction.destAddress && formatAddress(transaction.destAddress)}
        </p>
        <div className="transaction-date-amount">
          <p
            className="transaction-date"
            data-testid="transaction-date"
          >
            Date: <span>{date}</span>
          </p>
          <p
            className="transaction-amount"
            data-testid="transaction-amount"
          >
            Amount:{' '}
            <span>{transaction && Format.BTCValue(transaction.value)}</span>
          </p>
        </div>
      </div>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <TransactionDetails
            transaction={transaction}
            getConfirmations={getConfirmations}
          />
        </PopUp>
      )}
    </li>
  )
}

export default Transaction
