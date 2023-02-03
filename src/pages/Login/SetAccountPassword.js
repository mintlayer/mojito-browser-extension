import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { Login } from '@ContainerComponents'

import { Account } from '@Entities'
import { AccountContext } from '@Contexts'

const SetAccountPasswordPage = () => {
  const { setWalletInfo } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (address, id, name, nextAddress) => {
    setWalletInfo(address, id, name, nextAddress)
    navigate('/dashboard')
  }

  return (
    <Login.SetPassword
      onSubmit={login}
      checkPassword={Account.unlockAccount}
    />
  )
}

export default SetAccountPasswordPage
