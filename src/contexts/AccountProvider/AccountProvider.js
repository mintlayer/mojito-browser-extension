import React, { createContext, useEffect, useState } from 'react'
import differenceInMinutes from 'date-fns/differenceInMinutes'
import { LocalStorageService } from '@Storage'
import { AppInfo } from '@Constants'

const AccountContext = createContext()

const AccountProvider = ({ value: propValue, children }) => {
  const [addresses, setAddresses] = useState('')
  const [accountID, setAccountID] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accounts, setAccounts] = useState(null)
  const [lines, setLines] = useState([])
  const [entropy, setEntropy] = useState([])
  const [balanceLoading, setBalanceLoading] = useState(false)
  const isExtended = window.location.href.includes('popup.html')

  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = 30

  const setId = (id) => id && setAccountID(id)
  const setName = (name) => name && setAccountName(name)
  const unlockAccount = (addresses, id, name) => {
    const account = { addresses, id, name }
    LocalStorageService.setItem(accountRegistryName, account)
  }

  const unlockAccountAndSaveParams = (addresses, id, name) => {
    unlockAccount(addresses, id, name)
    setAddresses(addresses)
    setName(name)
    setId(id)
  }

  const checkAccountLockState = () => {
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return false

    const account = registry
    setAddresses(account.addresses)
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
      ? LocalStorageService.removeItem(accountRegistryName)
      : setAddresses(account.addresses) &&
        setId(account.id) &&
        setName(account.name)

    return isUnlocked
  }

  const setLoginTimeoutLimit = () => {
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return false

    const account = registry
    account.logoutDate = new Date().getTime()
    LocalStorageService.setItem(accountRegistryName, account)
  }

  const verifyAccountsExistence = async () => {
    const accountsPresent = await AppInfo.appAccounts()
    setAccounts(
      accountsPresent.map((item) => ({ name: item.name, id: item.id })),
    )
  }

  const logout = () => LocalStorageService.removeItem(accountRegistryName)

  const value = {
    accountRegistryName,
    addresses,
    accountName,
    lines,
    setLines,
    entropy,
    setEntropy,
    setWalletInfo: unlockAccountAndSaveParams,
    isAccountUnlocked: checkAccountLockState,
    setLoginTimeoutLimit,
    logout,
    accountID,
    setAccountID: setId,
    balanceLoading,
    setBalanceLoading,
    isExtended,
    verifyAccountsExistence,
    accounts,
    setAccounts,
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
