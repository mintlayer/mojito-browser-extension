import React, { createContext, useEffect, useState } from 'react'
import differenceInMinutes from 'date-fns/differenceInMinutes'

const AccountContext = createContext()

const AccountProvider = ({ value: propValue, children }) => {
  const [btcAddress, setBtcAddress] = useState('')
  const [accountID, setAccountID] = useState('')
  const [accountName, setAccountName] = useState('')
  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = 30

  const setId = (id) => id && setAccountID(id)
  const setName = (name) => name && setAccountName(name)
  const unlockAccount = (address, id, name) => {
    const account = { address, id, name }
    localStorage.setItem(accountRegistryName, JSON.stringify(account))
  }

  const unlockAccountAndSaveParams = (address, id, name) => {
    unlockAccount(address, id, name)
    setBtcAddress(address)
    setName(name)
    setId(id)
  }

  const checkAccountLockState = () => {
    const registry = localStorage.getItem(accountRegistryName)
    if (!registry) return false

    const account = JSON.parse(registry)
    setBtcAddress(account.address)
    setId(account.id)
    setName(account.name)

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
      : setBtcAddress(account.address) &&
        setId(account.id) &&
        setName(account.name)

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
    accountRegistryName,
    btcAddress,
    accountName,
    setWalletInfo: unlockAccountAndSaveParams,
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
