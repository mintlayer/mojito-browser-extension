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
  const [accountPasswordPritinity, setaAccountPasswordPritinity] =
    useState(true)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)
  const [unlockingAccount, setUnlockingAccount] = useState(false)

  const passwordFieldValidity = async () => {
    try {
      const address = await checkPassword(account.id, accountPasswordValue)
      return address
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
    setaAccountPasswordPritinity(false)
    setUnlockingAccount(true)

    passwordFieldValidity().then((address) => {
      if (!address) {
        setAccountPasswordValid(false)
        setUnlockingAccount(false)
        setAccountPasswordErrorMessage('Wrong password')
        return
      }
      onSubmit(address)
    })
  }

  return (
    <div>
      <Header />
      <div className="content">
        <CenteredLayout>
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
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetPassword
