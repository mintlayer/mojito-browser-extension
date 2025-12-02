import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { Login } from '@ContainerComponents'

import { Account } from '@Entities'
import { AccountContext } from '@Contexts'

const SetAccountPasswordPage = ({ nextAfterUnlock }) => {
  const { setWalletInfo } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (addresses, id, name) => {
    setWalletInfo(addresses, id, name)
    if (nextAfterUnlock) {
      navigate(nextAfterUnlock.route, { state: nextAfterUnlock.state })
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <Login.SetPassword
      onSubmit={login}
      checkPassword={Account.unlockAccount}
    />
  )
}

export default SetAccountPasswordPage
