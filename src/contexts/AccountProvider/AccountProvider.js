import React, { createContext, useEffect, useState } from 'react'
import differenceInMinutes from 'date-fns/differenceInMinutes'

const AccountContext = createContext()

const AccountProvider = ({ value: propValue, children }) => {
  const [btcAddress, setBtcAddress] = useState('')
  const [accountID, setAccountID] = useState('')
  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = 30

  const setId = (id) => setAccountID(id)

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

  const logout = () => localStorage.removeItem(accountRegistryName)

  const value = {
    btcAddress,
    setBtcAddress: unlockAccountAndSaveParams,
    isAccountUnlocked: checkAccountLockState,
    setLoginTimeoutLimit,
    logout,
    accountID,
    setAccountID: setId,
  }

  useEffect(() => {
    window.addEventListener('unload', setLoginTimeoutLimit)
  }, [])

  return (
    <AccountContext.Provider value={propValue || value}>
      {children}
    </AccountContext.Provider>
  )
}

export { AccountContext, AccountProvider }
