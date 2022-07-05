import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import SetAccountPassword from '../../commons/components/set-account-password'
import { Context } from '../../ContextProvider'

const SetAccountPasswordPage = () => {
  const { setBtcAddress } = useContext(Context)
  const navigate = useNavigate()

  const login = (address) => {
    setBtcAddress(address)
    navigate('/wallet')
  }

  return <SetAccountPassword onSubmit={login} />
}

export default SetAccountPasswordPage
