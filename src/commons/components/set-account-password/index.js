import { useState } from 'react'

import { useLocation } from 'react-router-dom'

import Expressions from '../../utils/expressions'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import TextField from '../basic/textField'
import Header from '../advanced/header'

import './index.css'

const SetAccountPaswword = ({ onSubmit }) => {
  const location = useLocation()
  const account = location.state.account

  const passwordPattern = Expressions.PASSWORD
  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)

  const passwordFieldValidity = (value) => {
    setAccountPasswordValid(value.match(passwordPattern))
  }

  const accountPasswordChangeHandler = (value) => {
    passwordFieldValidity(value)
    setAccountPasswordValue(value)
  }

  const doLogin = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onSubmit && onSubmit(account, accountPasswordValue)
  }

  return (
    <div>
      <Header />
      <div className="account-password">
        <CenteredLayout>
          <div className="content">
            <p className="password-for">Password For</p>
            <h2 className="account-name">{account.name}</h2>
          </div>

          <TextField
            value={accountPasswordValue}
            onChangeHandle={accountPasswordChangeHandler}
            validity={accountPasswordValid}
            pattern={passwordPattern}
            password
            label={''}
            placeHolder={'Password'}
          />
          <div className="footer">
            <Button onClickHandle={doLogin}>Log In</Button>
          </div>
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetAccountPaswword
