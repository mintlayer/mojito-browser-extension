import React, { createContext, useEffect, useState } from 'react'
import { differenceInMinutes } from 'date-fns'
import { LocalStorageService } from '@Storage'
import { notifyWalletLocked, stampWalletLock } from '@Browser'
import { AppInfo, LOGIN_TIMEOUT_MINUTES } from '@Constants'

const AccountContext = createContext()

const AccountProvider = ({ value: propValue, children }) => {
  const [addresses, setAddresses] = useState('')
  const [accountID, setAccountID] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accounts, setAccounts] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(undefined)
  const [removeAccountPopupOpen, setRemoveAccountPopupOpen] = useState(false)
  const [sliderMenuOpen, setSliderMenuOpen] = useState(false)
  const [customBackAction, setCustomBackAction] = useState(null)
  const isExtended = window.location.href.includes('popup.html')

  const accountRegistryName = 'unlockedAccount'
  const loginTimeoutInMinutes = LOGIN_TIMEOUT_MINUTES

  const setId = (id) => id && setAccountID(id)
  const setName = (name) => name && setAccountName(name)
  const unlockAccount = (addresses, id, name) => {
    const account = { addresses, id, name }
    LocalStorageService.setItem(accountRegistryName, account)
  }

  const unlockAccountAndSaveParams = (addresses, id, name) => {
    unlockAccount(addresses, id, name)
    // Live session: any stale lock mirror must not make the worker sweep
    // grants while the wallet is unlocked.
    stampWalletLock(null)
    setAddresses(addresses)
    setName(name)
    setId(id)
  }

  const checkAccountLockState = (updateState = false) => {
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return false

    const account = registry
    const { logoutDate } = account

    if (!logoutDate) {
      // No stamped idle clock: only reachable right after an unlock, which
      // already cleared the lock mirror.
      if (updateState) {
        setAddresses(account.addresses)
        setId(account.id)
        setName(account.name)
      }
      return true
    }

    const timeSinceClosed = differenceInMinutes(
      new Date(),
      new Date(logoutDate),
      { roundingMethod: 'ceil' },
    )
    const isUnlocked = timeSinceClosed < loginTimeoutInMinutes

    if (!isUnlocked) {
      LocalStorageService.removeItem(accountRegistryName)
      // SECURITY: locking the wallet must also revoke every dApp connect
      // grant — the 30-minute timeout is a lock, not just a registry clear.
      // The mirror stamp lands BEFORE the notify (same ordering as logout):
      // it is the durable witness, so a lost message still gets swept at the
      // worker's next boot.
      stampWalletLock(account.logoutDate)
      notifyWalletLocked()
    } else {
      // Resumed before the timeout: the session is live again — clear the
      // pagehide-stamped mirror so the worker never sweeps grants for an
      // open, unlocked wallet.
      stampWalletLock(null)
      if (updateState) {
        setAddresses(account.addresses)
        setId(account.id)
        setName(account.name)
      }
    }

    return isUnlocked
  }

  const setLoginTimeoutLimit = () => {
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return false

    const account = registry
    account.logoutDate = new Date().getTime()
    LocalStorageService.setItem(accountRegistryName, account)
    // Mirror the stamp for the service worker: with no wallet page open it
    // is the only way it can observe the 30-minute auto-lock.
    stampWalletLock(account.logoutDate)
  }

  const verifyAccountsExistence = async () => {
    const accountsPresent = await AppInfo.appAccounts()
    setAccounts(
      accountsPresent.map((item) => ({ name: item.name, id: item.id })),
    )
  }

  const logout = () => {
    LocalStorageService.removeItem(accountRegistryName)
    // SECURITY: logout is a lock for the dApp bridge: the background must
    // revoke every connect grant and tell the sites' open tabs, or they keep
    // acting on a session the user believes is gone. The mirror write lands
    // BEFORE the notify so a lost message still gets swept on next boot.
    stampWalletLock(Date.now())
    notifyWalletLocked()
  }

  const value = {
    accountRegistryName,
    addresses,
    accountName,
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
    deletingAccount,
    setDeletingAccount,
    removeAccountPopupOpen,
    setRemoveAccountPopupOpen,
    sliderMenuOpen,
    setSliderMenuOpen,
    customBackAction,
    setCustomBackAction,
  }

  useEffect(() => {
    window.addEventListener('pagehide', setLoginTimeoutLimit)
  }, [])

  return (
    <AccountContext.Provider value={propValue || value}>
      {children}
    </AccountContext.Provider>
  )
}

export { AccountContext, AccountProvider }
