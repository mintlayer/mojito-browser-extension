import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AccountContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { Loading } from '@ComposedComponents'
import { CreateRestorePage, LoginPage } from '@Pages'
import Logo from '@Assets/images/logo96.png'

import './Home.css'

const HomePage = () => {
  const effectCalled = useRef(false)
  const [accounts, setAccounts] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const location = useLocation()

  const navigate = useNavigate()
  const { isAccountUnlocked } = useContext(AccountContext)

  useEffect(() => {
    const currentUnlocked = isAccountUnlocked()
    setUnlocked(currentUnlocked)
    currentUnlocked && navigate('/dashboard')
  }, [isAccountUnlocked, navigate])

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const verifyAccountsExistence = async () => {
      const accountsPresent = await AppInfo.appAccounts()
      setAccounts(
        accountsPresent.map((item) => ({ name: item.name, id: item.id })),
      )
    }
    verifyAccountsExistence()
  }, [])

  const Home = () => {
    if (accounts === null) return <Loading />

    return !accounts.length || location.state?.fromLogin ? (
      <CreateRestorePage />
    ) : (
      <LoginPage accounts={accounts} />
    )
  }

  return (
    !unlocked && (
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
