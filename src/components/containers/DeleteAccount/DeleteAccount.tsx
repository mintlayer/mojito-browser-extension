import { useState, useContext, ChangeEvent, ReactNode } from 'react'

import { CenteredLayout } from '@LayoutComponents'
import { Button } from '@BasicComponents'
import { Login } from '@ContainerComponents'

import { Account } from '@Entities'
import { AccountContext, MintlayerContext } from '@Contexts'
import { useNavigate } from 'react-router'

import styles from './DeleteAccount.module.css'

const DeleteAccount = () => {
  const [step, setStep] = useState(1)
  const [seedSaved, setSeedSaved] = useState(false)
  const [understandIrreversible, setUnderstandIrreversible] = useState(false)
  const {
    logout,
    verifyAccountsExistence,
    deletingAccount,
    setRemoveAccountPopupOpen,
  } = useContext(AccountContext)
  const { setAllDataFetching } = useContext(MintlayerContext)
  const navigate = useNavigate()

  const canProceed = seedSaved && understandIrreversible

  const nextButonClickHandler = () => setStep(2)

  const deleteAccountHandler = async (
    addresses: unknown,
    accountId: string | number,
  ) => {
    try {
      await Account.deleteAccount(accountId as string)
      await verifyAccountsExistence()
      navigate('/')
      setAllDataFetching(false)
      logout()
      setRemoveAccountPopupOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  const onCancel = () => {
    setRemoveAccountPopupOpen(false)
  }

  const label = (): ReactNode => (
    <div className={styles.labelRow}>
      <div>
        <h1>{deletingAccount.name}</h1>
      </div>
      <p>Enter your password to delete this wallet</p>
    </div>
  )

  return (
    <CenteredLayout>
      {step === 1 && (
        <div className={styles.container}>
          <div className={styles.warningBadge}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <h2 className={styles.title}>Delete wallet permanently?</h2>
          <p className={styles.subtitle}>
            All local data associated with this wallet will be permanently lost.
          </p>

          <div className={styles.warningBox}>
            <svg
              className={styles.warningBoxIcon}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <div className={styles.warningBoxContent}>
              <strong>This action cannot be undone</strong>
              <span>
                Make sure you have securely saved your seed phrase before
                proceeding.
              </span>
            </div>
          </div>

          <div className={styles.checkboxList}>
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={seedSaved}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSeedSaved(e.target.checked)
                }
              />
              <span>I have saved my seed phrase in a safe place</span>
            </label>
            <label className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={understandIrreversible}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setUnderstandIrreversible(e.target.checked)
                }
              />
              <span>I understand this action is irreversible</span>
            </label>
          </div>

          <div className={styles.buttonRow}>
            <Button
              alternate
              onClickHandle={onCancel}
              extraStyleClasses={[styles.cancelButton]}
            >
              Cancel
            </Button>
            <Button
              onClickHandle={nextButonClickHandler}
              extraStyleClasses={[styles.deleteButton]}
              disabled={!canProceed}
            >
              <span className={styles.deleteButtonInner}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
                Delete wallet
              </span>
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <Login.SetPassword
          onSubmit={deleteAccountHandler}
          checkPassword={Account.unlockAccount}
          selectedAccount={deletingAccount}
          buttonTitle="Delete Wallet"
          customLabel={label()}
        />
      )}
    </CenteredLayout>
  )
}

export default DeleteAccount
