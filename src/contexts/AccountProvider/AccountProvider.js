import React, { createContext, useEffect, useState } from 'react'
import differenceInMinutes from 'date-fns/differenceInMinutes'

const AccountContext = createContext()

const AccountProvider = ({ value: propValue, children }) => {
  const [btcAddresses, setBtcAddresses] = useState('')
  const [nextAddress, setNextAddress] = useState('')
  const [accountID, setAccountID] = useState('')
  const [accountName, setAccountName] = useState('')
  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = 30

  const setId = (id) => id && setAccountID(id)
  const setName = (name) => name && setAccountName(name)
  const unlockAccount = (addresses, id, name, nextAddress) => {
    const account = { addresses, id, name, nextAddress }
    localStorage.setItem(accountRegistryName, JSON.stringify(account))
  }

  const unlockAccountAndSaveParams = (addresses, id, name, nextAddress) => {
    unlockAccount(addresses, id, name, nextAddress)
    setNextAddress(nextAddress)
    setBtcAddresses(addresses)
    setName(name)
    setId(id)
  }

  const checkAccountLockState = () => {
    const registry = localStorage.getItem(accountRegistryName)
    if (!registry) return false

    const account = JSON.parse(registry)
    setBtcAddresses(account.addresses)
    setId(account.id)
    setName(account.name)
    setNextAddress(account.nextAddress)

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
      : setBtcAddresses(account.addresses) &&
        setId(account.id) &&
        setName(account.name) &&
        setNextAddress(account.nextAddress)

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
    btcAddresses,
    nextAddress,
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
