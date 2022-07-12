import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { Login } from '@ContainerComponents'
import { AccountContext } from '@Contexts'

const SetAccountPasswordPage = () => {
  const { setBtcAddress } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (address) => {
    setBtcAddress(address)
    navigate('/wallet')
  }

  return <Login.SetAccountPassword onSubmit={login} />
}

export default SetAccountPasswordPage
