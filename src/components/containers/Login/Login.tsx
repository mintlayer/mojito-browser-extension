import React, { useContext } from 'react'
import { AccountContext } from '@Contexts'

import AccountCard from './AccountCard'
import styles from './Login.module.css'

interface Account {
  id: string | number
  name: string
}

interface LoginProps {
  accounts: Account[]
  onSelect?: (account: Account) => void
  onCreate?: () => void
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #a8e6cf, #f9e79f, #f5b041)',
  'linear-gradient(135deg, #89CFF0, #B19CD9)',
  'linear-gradient(135deg, #f5af19, #f12711)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
]

const Login = ({ accounts, onSelect, onCreate }: LoginProps) => {
  const { setRemoveAccountPopupOpen, setDeletingAccount } =
    useContext(AccountContext)
  const onSelectAccount = (account: Account) => onSelect && onSelect(account)
  const onCreateAccount = () => onCreate && onCreate()

  const onDeleteAccount = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation()
    setDeletingAccount(account)
    setRemoveAccountPopupOpen(true)
  }

  return (
    <div
      data-testid="list-accounts"
      className={styles.container}
    >
      <h2 className={styles.heading}>Choose an account</h2>
      <p className={styles.subtitle}>Select which wallet to unlock</p>

      <ul className={styles.list}>
        {accounts.map((account, index) => (
          <AccountCard
            key={account.id}
            account={account}
            gradient={AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length]}
            onSelect={onSelectAccount}
            onDelete={onDeleteAccount}
          />
        ))}
      </ul>

      <button
        className={styles.addButton}
        onClick={onCreateAccount}
        data-testid="add-wallet-button"
      >
        <span className={styles.addIcon}>+</span>
        Add or import wallet
      </button>
    </div>
  )
}

export default Login
