import React, { useState } from 'react'
import { format } from 'date-fns'

import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as LoopIcon } from '@Assets/images/icon-loop.svg'
import { ReactComponent as StakeIcon } from '@Assets/images/icon-stake.svg'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'
import { ReactComponent as UnconfirmedIcon } from '@Assets/images/icon-sand.svg'
import { ReactComponent as SwapIcon } from '@Assets/images/icon-swap.svg'
import { ML } from '@Helpers'
import { PopUp } from '@ComposedComponents'
import TransactionAmount from './TransactionAmount'
import { useNavigate } from 'react-router'

import TransactionDetails from './TransactionDetails'

import styles from './Transaction.module.css'

const Info = ({ transaction }) => {
  const navigate = useNavigate()
  return (
    <li
      className={styles.transaction}
      data-testid="transaction"
      onClick={() => navigate('/settings')}
    >
      <div
        className={`${styles.logoType} ${styles.logoTypeInfo}`}
        data-testid="transaction-icon"
      >
        !
      </div>
      <div className={styles.detail}>
        <p
          className={styles.idInfo}
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

  return transaction.direction === 'info' ? (
    <Info transaction={transaction} />
  ) : (
    <li
      className={styles.transaction}
      data-testid="transaction"
      onClick={() => setDetailPopupOpen(true)}
    >
      {(transaction.type === 'Transfer' || !transaction.type) &&
      transaction.date ? (
        <div
          className={`${styles.logoType} ${
            transaction.direction === 'out' ? styles.logoOut : ''
          }`}
          data-testid="transaction-icon"
        >
          <ArrowIcon
            className={`${styles.arrowIcon} ${
              transaction.direction === 'out' ? styles.arrowIconOut : ''
            }`}
          />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'CreateOrder' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeStake}`}
          data-testid="transaction-icon"
        >
          <SwapIcon className={styles.stakeIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'FillOrder' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeStake}`}
          data-testid="transaction-icon"
        >
          <SwapIcon className={styles.stakeIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.sameWalletTransaction &&
      !transaction.type === 'FillOrder' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeSame}`}
          data-testid="transaction-icon"
        >
          <LoopIcon className={styles.loopIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'Unconfirmed' || !transaction.date ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeUnconfirmed}`}
          data-testid="transaction-icon"
        >
          <UnconfirmedIcon className={styles.unconfirmedIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'Delegate Withdrawal' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeWithdrawal}`}
          data-testid="transaction-icon"
        >
          <StakeIcon className={styles.stakeIcon} />
          <ArrowIcon
            className={`${styles.arrowIconStake} ${
              transaction.direction === 'out' ? styles.arrowIconOut : ''
            }`}
          />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'CreateStakePool' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeStake}`}
          data-testid="transaction-icon"
        >
          <StakeIcon className={styles.stakeIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'CreateDelegationId' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeStake}`}
          data-testid="transaction-icon"
        >
          <StakeIcon className={styles.stakeIcon} />
        </div>
      ) : (
        <></>
      )}
      {transaction.type === 'DelegateStaking' ? (
        <div
          className={`${styles.logoType} ${styles.logoTypeDelegate} ${styles.logoTypeStake}`}
          data-testid="transaction-icon"
        >
          <DelegationIcon className={styles.delegationIcon} />
        </div>
      ) : (
        <></>
      )}
      <div className={styles.detail}>
        <p
          className={styles.id}
          data-testid="transaction-otherPart"
        >
          {transaction.direction === 'in' &&
            transaction.from &&
            ML.formatAddress(transaction.from[0])}
          {transaction.direction === 'out' &&
            transaction.to &&
            ML.formatAddress(transaction.to[0])}
          {transaction.otherPart &&
            [...new Set(transaction.otherPart)].length > 1 &&
            ` (+${transaction.otherPart.length - 1})`}
          {transaction.destAddress && ML.formatAddress(transaction.destAddress)}
        </p>
        <div className={styles.dateAmount}>
          <p
            className={styles.date}
            data-testid="transaction-date"
          >
            Date: <span>{date}</span>
          </p>
          <TransactionAmount
            transaction={transaction}
            title={'Amount:'}
          />
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
