import React, { createContext, useEffect, useState } from 'react'
import differenceInMinutes from 'date-fns/differenceInMinutes'

export const Context = createContext()

export const ContextProvider = ({ children }) => {
  const [btcAddress, setBtcAddress] = useState('')
  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = 2

  const unlockAccount = (address) => {
    const account = { address }
    localStorage.setItem(accountRegistryName, JSON.stringify(account))
  }

  const unlockAccountAndSaveParams = (address) => {
    unlockAccount(address)
    setBtcAddress(address)
  }

  const checkAccountLockState = () => {
    const registry = localStorage.getItem(accountRegistryName)
    if (!registry) return false

    const account = JSON.parse(registry)
    setBtcAddress(account.address)

    const { logoutDate } = account
    if (!logoutDate) return true

    const timeSinceClosed = differenceInMinutes(
      new Date(),
      new Date(logoutDate),
      { roundingMethod: 'ceil' },
    )
    const isUnlocked = timeSinceClosed < loginTimeoutInMinutes

    !isUnlocked
      ? localStorage.removeItem(accountRegistryName)
      : setBtcAddress(account.address)

    return isUnlocked
  }

  const setLoginTimeoutLimit = () => {
    const registry = localStorage.getItem(accountRegistryName)
    if (!registry) return false

    const account = JSON.parse(registry)
    account.logoutDate = new Date().getTime()
    localStorage.setItem(accountRegistryName, JSON.stringify(account))
  }

  const value = {
    btcAddress,
    setBtcAddress: unlockAccountAndSaveParams,
    isAccountUnlocked: checkAccountLockState,
    setLoginTimeoutLimit,
  }

  useEffect(() => {
    window.addEventListener('beforeunload', setLoginTimeoutLimit)
  }, [])

  return <Context.Provider value={value}>{children}</Context.Provider>
}
