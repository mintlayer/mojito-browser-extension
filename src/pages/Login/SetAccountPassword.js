import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import SetAccountPassword from '../../components/containers/Login/SetPassword'
import { AccountContext } from '../../contexts/AccountProvider/AccountProvider'

const SetAccountPasswordPage = () => {
  const { setBtcAddress } = useContext(AccountContext)
  const navigate = useNavigate()

  const login = (address) => {
    setBtcAddress(address)
    navigate('/wallet')
  }

  return <SetAccountPassword onSubmit={login} />
}

export default SetAccountPasswordPage
