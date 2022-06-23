import { useRef } from 'react'

import './index.css'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import Header from '../advanced/header'
import { useLocation } from 'react-router-dom'

const SetAccountPaswword = ({ onSubmit }) => {
  const refPassword = useRef(null)

  const location = useLocation()
  const account = location.state.account

  const doLogin = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onSubmit && onSubmit(account, refPassword.current.value)
    refPassword.current.value = ''
  }

  return (
    <div>
      <Header />
      <div className="account-password">
        <CenteredLayout>
          <div className="content">
            <p className="password-for">Password For</p>
            <h2 className="account-name">{account.name}</h2>
            <input
              ref={refPassword}
              className="password"
              type="password"
              aria-label="Password"
              placeholder="Password"
            />
          </div>
          <div className="footer">
            <Button onClickHandle={doLogin}>Log In</Button>
          </div>
        </CenteredLayout>
      </div>
    </div>
  )
}

export default SetAccountPaswword
