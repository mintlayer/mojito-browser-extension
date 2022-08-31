import React, { useState } from 'react'
import { format } from 'date-fns'

import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'
import { Format } from '@Helpers'
import { PopUp } from '@ComposedComponents'

import TransactionDetails from './TransactionDetails'

import './Transaction.css'

const Transaction = ({ transaction, getConfirmations }) => {
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)
  const date = transaction.date
    ? format(new Date(transaction.date * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'
  const formatAddress = (address) => {
    const limitSize = 24
    const halfLimit = limitSize / 2
    const firstPart = address.slice(0, halfLimit)
    const lastPart = address.slice(address.length - halfLimit, address.length)
    return `${firstPart}...${lastPart}`
  }

  return (
    <li
      className="transaction"
      data-testid="transaction"
      onClick={() => setDetailPopupOpen(true)}
    >
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
      <div className="transaction-detail">
        <p
          className="transaction-id"
          data-testid="transaction-otherPart"
        >
          {transaction && formatAddress(transaction.otherPart[0])}
          {transaction &&
            [...new Set(transaction.otherPart)].length > 1 &&
            ` (+${transaction.otherPart.length - 1})`}
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
