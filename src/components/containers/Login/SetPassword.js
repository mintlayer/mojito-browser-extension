import { useState } from 'react'
import { useLocation } from 'react-router-dom'

import { Button } from '@BasicComponents'
import { Header, Loading, TextField } from '@ComposedComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'

import './SetPassword.css'

const SetPassword = ({ onChangePassword, onSubmit, checkPassword }) => {
  const location = useLocation()
  const account = location.state.account

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

  const doLogin = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setAccountPasswordPritinity(false)
    setUnlockingAccount(true)

    passwordFieldValidity().then((validated) => {
      const address = validated.address
      if (!address) {
        setAccountPasswordValid(false)
        setUnlockingAccount(false)
        setAccountPasswordErrorMessage('Wrong password')
        return
      }
      onSubmit(address, account.id, account.name)
    })
  }

  return (
    <div>
      <Header />
      <div className="content">
        <CenteredLayout>
          <form>
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
                  <Button onClickHandle={doLogin}>Log In</Button>
                </>
              ) : (
                <>
                  <h1 className="loadingText">
                    {' '}
                    Just a sec, we are validating your password...{' '}
                  </h1>
                  <Loading />
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
