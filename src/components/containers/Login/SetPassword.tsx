import { useState, FormEvent, ReactNode } from 'react'
import { useLocation } from 'react-router'

import { Button } from '@BasicComponents'
import { LoadingScreen, TextField } from '@ComposedComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'
import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'
import { ReactComponent as IconShield } from '@Assets/images/icon-shield.svg'

import styles from './SetPassword.module.css'

interface Account {
  id: string | number
  name: string
}

interface CheckPasswordResult {
  addresses?: unknown
  [key: string]: unknown
}

interface SetPasswordProps {
  onChangePassword?: (value: string) => void
  onSubmit?: (addresses: unknown, id: string | number, name: string) => void
  checkPassword: (
    id: string | number,
    password: string,
  ) => Promise<CheckPasswordResult>
  selectedAccount?: Account
  buttonTitle?: string
  customLabel?: string | ReactNode
}

const SetPassword = ({
  onChangePassword,
  onSubmit,
  checkPassword,
  selectedAccount,
  buttonTitle = 'Unlock wallet',
  customLabel,
}: SetPasswordProps) => {
  const location = useLocation()
  const account: Account = selectedAccount
    ? selectedAccount
    : location.state.account

  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountPasswordValid, setAccountPasswordValid] = useState<
    boolean | null
  >(null)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState<string | null>(null)
  const [unlockingAccount, setUnlockingAccount] = useState(false)

  const passwordFieldValidity = async () => {
    try {
      const accountData = await checkPassword(account.id, accountPasswordValue)
      return accountData
    } catch {
      return false
    }
  }

  const accountPasswordChangeHandler = (value: string) => {
    setAccountPasswordValue(value)
    onChangePassword && onChangePassword(value)
  }

  const label = (): ReactNode =>
    customLabel ? (
      customLabel
    ) : (
      <div className={styles.labelRow}>
        <div>
          <h1>{account.name}</h1>
          <h2>Welcome back</h2>
        </div>

        <p>Enter your password to unlock</p>
      </div>
    )

  const submitHandler = (e: FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAccountPasswordPristinity(false)
    setUnlockingAccount(true)

    passwordFieldValidity().then((validated) => {
      if (!validated || !validated.addresses) {
        setAccountPasswordValid(false)
        setUnlockingAccount(false)
        setAccountPasswordErrorMessage('Incorrect password')
        return
      }
      onSubmit && onSubmit(validated.addresses, account.id, account.name)
    })
  }

  return (
    <div>
      <div className={styles.content}>
        <CenteredLayout>
          <form
            className={styles.form}
            onSubmit={submitHandler}
          >
            <VerticalGroup>
              {!unlockingAccount ? (
                <>
                  <div className={styles.shieldBadge}>
                    <IconShield />
                  </div>
                  <TextField
                    value={accountPasswordValue}
                    onChangeHandle={accountPasswordChangeHandler}
                    validity={accountPasswordValid}
                    password
                    label={label()}
                    placeHolder={'Password'}
                    pristinity={accountPasswordPristinity}
                    errorMessages={accountPasswordErrorMessage}
                    alternate
                    focus
                    bigGap={false}
                  />
                  <CenteredLayout>
                    <Button
                      onClickHandle={submitHandler}
                      extraStyleClasses={[styles.loginPasswordSubmit]}
                      dataTestId="login-password-submit"
                    >
                      {buttonTitle}
                      <IconArrowRight className={styles.loginButtonIcon} />
                    </Button>
                  </CenteredLayout>
                </>
              ) : (
                <LoadingScreen text="Just a sec, we are validating your password..." />
              )}
            </VerticalGroup>
          </form>
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetPassword
