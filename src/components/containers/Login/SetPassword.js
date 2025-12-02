import { useState } from 'react'
import { useLocation } from 'react-router'

import { Button } from '@BasicComponents'
import { Loading, TextField } from '@ComposedComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'
import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'

import './SetPassword.css'

const SetPassword = ({
  onChangePassword,
  onSubmit,
  checkPassword,
  selectedAccount,
  buttonTitle = 'Log In',
}) => {
  const location = useLocation()
  const account = selectedAccount ? selectedAccount : location.state.account
  const loadingExtraClasses = ['loading-big']

  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountPasswordValid, setAccountPasswordValid] = useState(null)
  const [accountPasswordPritinity, setAccountPasswordPritinity] = useState(true)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)
  const [unlockingAccount, setUnlockingAccount] = useState(false)

  const passwordFieldValidity = async () => {
    try {
      const accountData = await checkPassword(account.id, accountPasswordValue)
      return accountData
    } catch (e) {
      return false
    }
  }

  const accountPasswordChangeHandler = (value) => {
    setAccountPasswordValue(value)
    onChangePassword && onChangePassword(value)
  }

  const label = () => (
    <>
      Password for <strong>{account.name}</strong>
    </>
  )

  const submitHandler = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAccountPasswordPritinity(false)
    setUnlockingAccount(true)

    passwordFieldValidity().then((validated) => {
      const addresses = validated.addresses
      if (!addresses) {
        setAccountPasswordValid(false)
        setUnlockingAccount(false)
        setAccountPasswordErrorMessage('Incorrect password')
        return
      }
      onSubmit(addresses, account.id, account.name)
    })
  }

  return (
    <div>
      <div className="content">
        <CenteredLayout>
          <form onSubmit={submitHandler}>
            <VerticalGroup bigGap>
              {!unlockingAccount ? (
                <>
                  <TextField
                    value={accountPasswordValue}
                    onChangeHandle={accountPasswordChangeHandler}
                    validity={accountPasswordValid}
                    password
                    label={label()}
                    placeHolder={'Password'}
                    pristinity={accountPasswordPritinity}
                    errorMessages={accountPasswordErrorMessage}
                    alternate
                    focus
                  />
                  <CenteredLayout>
                    <Button
                      onClickHandle={submitHandler}
                      extraStyleClasses={['login-password-submit']}
                      dataTestId="login-password-submit"
                    >
                      {buttonTitle}
                      <IconArrowRight className="login-button-icon" />
                    </Button>
                  </CenteredLayout>
                </>
              ) : (
                <>
                  <h1 className="loadingText">
                    {' '}
                    Just a sec, we are validating your password...{' '}
                  </h1>
                  <Loading extraStyleClasses={loadingExtraClasses} />
                </>
              )}
            </VerticalGroup>
          </form>
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetPassword
