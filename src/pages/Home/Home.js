import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { AccountContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { Loading } from '@ComposedComponents'
import { CreateRestorePage, LoginPage } from '@Pages'

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

  const verifyAccountsExistence = async () => {
    const accountsPresent = await AppInfo.appAccounts()
    setAccounts(
      accountsPresent.map((item) => ({ name: item.name, id: item.id })),
    )
  }

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true
    verifyAccountsExistence()
  }, [accounts])

  const Home = () => {
    if (accounts === null) return <Loading />

    return !accounts.length || location.state?.fromLogin ? (
      <CreateRestorePage />
    ) : (
      <LoginPage
        accounts={accounts}
        verifyAccountsExistence={verifyAccountsExistence}
      />
    )
  }

  return (
    !unlocked && (
      <>
        <Home />
      </>
    )
  )
}

export default HomePage
