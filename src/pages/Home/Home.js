import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AccountContext } from '../../contexts/AccountProvider/AccountProvider'

import { appAccounts } from '../../utils/Constants/AppInfo'

import CreateRestore from '../CreateRestore/CreateRestore'
import ListAccountsContainer from '../Login/Login'

import Loading from '../../components/composed/Loading/Loading'

import Logo from '../../assets/images/logo96.png'

import './Home.css'

const HomePage = () => {
  const effectCalled = useRef(false)
  const [accounts, setAccounts] = useState(null)
  const location = useLocation()

  const navigate = useNavigate()
  const { isAccountUnlocked } = useContext(AccountContext)
  const accountUnlocked = isAccountUnlocked()
  accountUnlocked && navigate('/wallet')

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const verifyAccountsExistence = async () => {
      const accountsPresent = await appAccounts()
      setAccounts(
        accountsPresent.map((item) => ({ name: item.name, id: item.id })),
      )
    }
    verifyAccountsExistence()
  }, [])

  const Home = () => {
    if (accounts === null) return <Loading />
    return !accounts.length || location.state?.fromLogin ? (
      <CreateRestore />
    ) : (
      <ListAccountsContainer accounts={accounts} />
    )
  }

  return (
    !accountUnlocked && (
      <>
        <div className="homeLogoContainer">
          <img
            src={Logo}
            alt="Mojito Logo"
            className="logo"
          />
          <h1 className="mojitoLettering">Mojito</h1>
        </div>
        <Home />
      </>
    )
  )
}

export default HomePage
