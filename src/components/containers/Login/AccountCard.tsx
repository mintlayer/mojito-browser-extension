import React from 'react'
import { ReactComponent as ChevronIcon } from '@Assets/images/icon-chevron-down.svg'
import { ReactComponent as IconBin } from '@Assets/images/icon-bin.svg'

import styles from './AccountCard.module.css'

interface Account {
  id: string | number
  name: string
}

interface AccountCardProps {
  account: Account
  gradient: string
  onSelect: (account: Account) => void
  onDelete: (e: React.MouseEvent, account: Account) => void
}

const AccountCard = ({
  account,
  gradient,
  onSelect,
  onDelete,
}: AccountCardProps) => {
  return (
    <li
      className={styles.card}
      onClick={() => onSelect(account)}
      data-testid="carousel-item"
    >
      <div
        className={styles.avatar}
        style={{ background: gradient }}
      />
      <div className={styles.cardInfo}>
        <p className={styles.cardName}>{account.name}</p>
      </div>
      <button
        className={styles.deleteButton}
        onClick={(e) => onDelete(e, account)}
        data-testid="delete-wallet-button"
        title="Remove account"
      >
        <IconBin className={styles.deleteIcon} />
      </button>
      <ChevronIcon className={styles.chevron} />
    </li>
  )
}

export default AccountCard
