import React, { useState } from 'react'
import { ReactComponent as StakeIcon } from '@Assets/images/icon-stake.svg'
import { Loading, PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'
import { Button } from '@BasicComponents'

import DelegationDetails from './DelegationDetails'

import styles from './Delegation.module.css'
import { format } from 'date-fns'
import { useNavigate } from 'react-router'

const Delegation = ({ delegation }) => {
  const navigate = useNavigate()

  const walletType = {
    name: 'Mintlayer',
    ticker: 'ML',
    chain: 'mintlayer',
  }

  const [detailPopupOpen, setDetailPopupOpen] = useState(false)

  let delegationOject = delegation

  if (delegation.type === 'Unconfirmed') {
    delegationOject = {
      balance: delegation.value,
      pool_id: delegation.poolId,
      delegation_id: 'Not confirmed',
      spend_destination: 'Not confirmed',
    }
  }

  const value = delegationOject.balance ? delegationOject.balance.decimal : 0

  const addFundsClickHandle = () => {
    navigate(
      '/wallet/' +
        walletType.name +
        '/staking/' +
        delegation.delegation_id +
        '/add-funds',
    )
  }

  const withdrawClickHandle = () => {
    navigate(
      '/wallet/' +
        walletType.name +
        '/staking/' +
        delegation.delegation_id +
        '/withdraw',
    )
  }

  const date = delegationOject.creation_time
    ? format(new Date(delegationOject.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'

  const delegationClickHandle = () => {
    setDetailPopupOpen(true)
  }

  const isDecommissioned = delegationOject.decommissioned
  const isUnconfirmed =
    delegation.type === 'Unconfirmed' && delegation.mode === 'delegation'
  const hasBalance =
    delegationOject.balance && delegationOject.balance.length > 11

  const cardClasses = [
    styles.card,
    hasBalance && isDecommissioned ? styles.nonEmpty : '',
  ]
    .filter(Boolean)
    .join(' ')

  const iconClass = [
    styles.icon,
    isDecommissioned ? styles.iconDecommissioned : '',
  ]
    .filter(Boolean)
    .join(' ')

  const buttonExtraStyles = [styles.actionButton]

  return (
    <li
      className={cardClasses}
      data-testid="delegation"
      data-poolid={delegationOject.pool_id}
      onClick={delegationClickHandle}
    >
      {isUnconfirmed && (
        <>
          <div className={styles.progressBar}></div>
          <div className={styles.loadingWrapper}>
            <Loading />
          </div>
        </>
      )}

      <div
        className={iconClass}
        data-testid="delegation-icon"
      >
        <StakeIcon className={styles.stakeIcon} />
      </div>

      <div className={styles.info}>
        <p
          className={styles.poolId}
          data-testid="delegation-otherPart"
        >
          {delegation && delegationOject.pool_id
            ? ML.formatAddress(delegationOject.pool_id)
            : ''}
          {isDecommissioned && (
            <span className={styles.inactiveBadge}>Inactive</span>
          )}
        </p>
        {delegationOject.creation_time && (
          <p
            className={styles.date}
            data-testid="delegation-date"
          >
            {date}
          </p>
        )}
        {isUnconfirmed && (
          <p
            className={styles.date}
            data-testid="delegation-date"
          >
            Preparing delegation for staking
          </p>
        )}
      </div>

      <div className={styles.amountBlock}>
        <p
          className={styles.amount}
          data-testid="delegation-amount"
        >
          {delegation && value ? value : '—'}
        </p>
        <p className={styles.currency}>ML</p>
      </div>

      <div className={styles.actions}>
        {delegation.type !== 'Unconfirmed' ? (
          <>
            <Button
              extraStyleClasses={buttonExtraStyles}
              onClickHandle={addFundsClickHandle}
              disabled={isDecommissioned}
            >
              Add funds
            </Button>
            <Button
              alternate
              extraStyleClasses={buttonExtraStyles}
              onClickHandle={withdrawClickHandle}
            >
              Withdraw
            </Button>
          </>
        ) : (
          <>
            <Button
              extraStyleClasses={buttonExtraStyles}
              disabled={true}
            >
              Add funds
            </Button>
            <Button
              alternate
              extraStyleClasses={buttonExtraStyles}
              disabled={true}
            >
              Withdraw
            </Button>
          </>
        )}
      </div>

      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <DelegationDetails
            delegation={delegationOject}
            onAddFunds={addFundsClickHandle}
            onWithdraw={withdrawClickHandle}
          />
        </PopUp>
      )}
    </li>
  )
}

export default Delegation
