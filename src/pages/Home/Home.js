import { useContext, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { AccountContext } from '@Contexts'
import { Loading } from '@ComposedComponents'
import { CreateRestorePage, LoginPage } from '@Pages'

import './Home.css'

const HomePage = () => {
  const effectCalled = useRef(false)
  const unlockChecked = useRef(false)
  const location = useLocation()

  const navigate = useNavigate()
  const { isAccountUnlocked, accounts, verifyAccountsExistence } =
    useContext(AccountContext)

  const unlocked = isAccountUnlocked(false)

  useEffect(() => {
    if (unlockChecked.current) return
    if (unlocked) {
      unlockChecked.current = true
      isAccountUnlocked(true)
      navigate('/dashboard')
    }
  }, [unlocked, isAccountUnlocked, navigate])

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true
    verifyAccountsExistence()
  }, [accounts, verifyAccountsExistence])

  if (unlocked) return null

  return accounts === null ? (
    <Loading />
  ) : !accounts.length || location.state?.fromLogin ? (
    <CreateRestorePage />
  ) : (
    <LoginPage accounts={accounts} />
  )
}

export default HomePage
