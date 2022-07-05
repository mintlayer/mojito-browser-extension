import { useState } from 'react'

import { useLocation } from 'react-router-dom'

import Expressions from '../../utils/expressions'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import TextField from '../basic/textField'
import Header from '../advanced/header'
import VerticalGroup from '../group/verticalGroup'

import './index.css'

const SetAccountPaswword = ({ onChangePassword, onSubmit }) => {
  const location = useLocation()
  const account = location.state.account

  const passwordPattern = Expressions.PASSWORD
  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)

  const passwordFieldValidity = (value) => {
    setAccountPasswordValid(!!value.match(passwordPattern))
  }

  const accountPasswordChangeHandler = (value) => {
    passwordFieldValidity(value)
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
    onSubmit && onSubmit(account, accountPasswordValue)
  }

  return (
    <div>
      <Header />
      <div className="content">
        <CenteredLayout>
          <VerticalGroup bigGap>
            <TextField
              value={accountPasswordValue}
              onChangeHandle={accountPasswordChangeHandler}
              validity={accountPasswordValid}
              pattern={passwordPattern}
              password
              label={label()}
              placeHolder={'Password'}
              alternate
            />
            <Button onClickHandle={doLogin}>Log In</Button>
          </VerticalGroup>
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetAccountPaswword
