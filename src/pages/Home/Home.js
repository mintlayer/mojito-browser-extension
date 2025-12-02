import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { AccountContext } from '@Contexts'
import { Loading } from '@ComposedComponents'
import { CreateRestorePage, LoginPage } from '@Pages'

import './Home.css'

const HomePage = () => {
  const effectCalled = useRef(false)
  const navigatedRef = useRef(false)
  const [unlocked, setUnlocked] = useState(false)
  const location = useLocation()

  const navigate = useNavigate()
  const { isAccountUnlocked, accounts, verifyAccountsExistence } =
    useContext(AccountContext)

  useEffect(() => {
    if (navigatedRef.current) return
    const currentUnlocked = isAccountUnlocked(true)
    setUnlocked(currentUnlocked)
    if (currentUnlocked) {
      navigatedRef.current = true
      navigate('/dashboard')
    }
  }, [isAccountUnlocked, navigate])

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true
    verifyAccountsExistence()
  }, [accounts, verifyAccountsExistence])

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
        <Home />
      </>
    )
  )
}

export default HomePage
