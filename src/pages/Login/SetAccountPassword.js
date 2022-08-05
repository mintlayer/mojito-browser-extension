import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { Login } from '@ContainerComponents'

import { Account } from '@Entities'
import { AccountContext } from '@Contexts'

const SetAccountPasswordPage = () => {
  const { setBtcAddress, setAccountID } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (address, id) => {
    setBtcAddress(address)
    setAccountID(id)
    navigate('/wallet')
  }

  return (
    <Login.SetPassword
      onSubmit={login}
      checkPassword={Account.unlockAccount}
    />
  )
}

export default SetAccountPasswordPage
