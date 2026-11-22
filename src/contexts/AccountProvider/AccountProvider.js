import React, { createContext, useEffect, useRef, useState } from 'react'
import { differenceInMinutes } from 'date-fns'
import { LocalStorageService } from '@Storage'
import {
  notifyWalletLocked,
  stampGrantsRevoked,
  stampWalletLock,
} from '@Browser'
import { AppInfo, LOGIN_TIMEOUT_MINUTES } from '@Constants'

const AccountContext = createContext()

// How often an OPEN page re-checks its inactivity clock against the
// 30-minute auto-lock: the lock fires within one tick of the boundary.
const LOCK_CHECK_INTERVAL_MS = 30 * 1000
// User activity refreshes the registry's persisted idle clock at most this
// often, so a page killed uncleanly reopens with a clock at most this stale.
const ACTIVITY_PERSIST_INTERVAL_MS = 60 * 1000

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

  // Persist-throttle watermark: the registry's `logoutDate` is THE idle
  // clock — stamped at unlock, refreshed here (throttled) on user activity
  // and stamped on pagehide — and the lock decision and mirror stamp key on
  // it everywhere. It must never be per-surface memory: a popup left open
  // must not lock a wallet the user is actively using in another surface,
  // and the lock's stamp must carry an already-aged clock the worker
  // sweeps immediately.
  const lastPersistedActivityRef = useRef(0)

  const setId = (id) => id && setAccountID(id)
  const setName = (name) => name && setAccountName(name)
  const unlockAccount = (addresses, id, name) => {
    const logoutDate = Date.now()
    // The mirror is stamped BEFORE the registry write: the stamp is
    // fire-and-forget, so if the page dies between the two writes the
    // reverse order would leave the previous session's EXPIRED mirror
    // witnessing against the new session's grants at the next worker boot
    // (false sweep). A fresh stamp while the registry briefly lags behind
    // is harmless — the prior session's grants were already revoked by its
    // lock, and the fresh stamp keeps AGING if this session is hard-killed
    // with no pagehide (crash, OOM, power loss) instead of leaving a
    // permanent null the worker could never sweep across restarts.
    stampWalletLock(logoutDate)
    const account = {
      addresses,
      id,
      name,
      // The idle clock starts at unlock: an open page auto-locks after 30
      // minutes WITHOUT activity, and a page killed before any pagehide
      // still ages out — here and on reopen.
      logoutDate,
    }
    LocalStorageService.setItem(accountRegistryName, account)
    return logoutDate
  }

  const unlockAccountAndSaveParams = (addresses, id, name) => {
    const logoutDate = unlockAccount(addresses, id, name)
    // A fresh unlock starts a full inactivity window.
    lastPersistedActivityRef.current = logoutDate
    setAddresses(addresses)
    setName(name)
    setId(id)
  }

  // Revokes the session: clears the registry, stamps the lock mirror with
  // the idle clock, stamps the durable revocation epoch ('grantsRevokedAt')
  // and notifies the background (which revokes every dApp connect grant).
  // Both stamps land BEFORE the notify: they are the durable witnesses, so
  // a lost message still gets swept at the worker's next boot — every
  // caller stamps an ALREADY-AGED mirror clock (expiry paths, logout, the
  // stampless-registry branch), so the mirror sweep lands immediately
  // instead of buying a fresh 30-minute mirror TTL. The epoch survives the
  // next unlock's mirror re-stamp (which never touches it), so even a
  // re-unlock that erases the expired mirror before the worker observes it
  // cannot resurrect the pre-logout grants: the worker sweeps every grant
  // whose approval timestamp is at or before the epoch.
  const lockWallet = (lockedAt) => {
    LocalStorageService.removeItem(accountRegistryName)
    stampWalletLock(lockedAt)
    stampGrantsRevoked()
    notifyWalletLocked()
  }

  const checkAccountLockState = (updateState = false) => {
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return false

    const account = registry
    const { logoutDate } = account

    if (!logoutDate) {
      // No stamped idle clock: only reachable for a registry written by a
      // pre-fix build (unlock now always stamps it). The session's age is
      // unknown — fail closed through the same revoke path as an expiry,
      // stamped already-expired so a lost notify never buys a fresh
      // 30-minute mirror TTL.
      lockWallet(Date.now() - LOGIN_TIMEOUT_MINUTES * 60 * 1000)
      return false
    }

    const timeSinceClosed = differenceInMinutes(
      new Date(),
      new Date(logoutDate),
      { roundingMethod: 'ceil' },
    )
    const isUnlocked = timeSinceClosed < loginTimeoutInMinutes

    if (!isUnlocked) {
      lockWallet(logoutDate)
    } else {
      // Resumed before the timeout: the session is live again — re-mirror
      // the registry clock so the worker holds the same idle deadline. A
      // pagehide-stamped mirror must not expire while an open, unlocked
      // wallet is live, and a NUMBER stamp (never null) keeps aging if
      // this session is later hard-killed without a pagehide.
      stampWalletLock(logoutDate)
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
    // There is no prior idle clock to preserve (the registry is discarded),
    // so stamp an ALREADY-EXPIRED one — the same fail-closed pattern as
    // checkAccountLockState's stampless-registry branch: a lost
    // walletLocked notify is then swept at the worker's next boot
    // immediately, instead of surviving up to a fresh 30-minute mirror TTL
    // while revoked-bound grants keep answering. The next unlock re-stamps
    // the mirror fresh (before the registry write), so no live session is
    // ever swept by it.
    lockWallet(Date.now() - LOGIN_TIMEOUT_MINUTES * 60 * 1000)
  }

  // User activity refreshes the SHARED persisted clock (the registry write
  // is throttled to at most one per persist interval, so a page killed
  // uncleanly reopens with a clock at most ACTIVITY_PERSIST_INTERVAL_MS
  // stale — and every other open surface sees the refresh too).
  const markUserActivity = () => {
    const now = Date.now()
    if (now - lastPersistedActivityRef.current < ACTIVITY_PERSIST_INTERVAL_MS)
      return
    const registry = LocalStorageService.getItem(accountRegistryName)
    if (!registry) return
    // Cross-surface race guard: a lock in ANOTHER surface can clear (or
    // re-stamp) the registry between the read above and the write below.
    // Re-verify against a fresh read and abandon the persist if the session
    // vanished or the clock moved underneath us — never resurrect a
    // just-locked wallet as unlocked while its grants are already revoked.
    // The residual window shrinks to the adjacent-statement gap; a skipped
    // persist just leaves the clock to the other surface's write.
    const fresh = LocalStorageService.getItem(accountRegistryName)
    if (!fresh || fresh.logoutDate !== registry.logoutDate) return
    LocalStorageService.setItem(accountRegistryName, {
      ...fresh,
      logoutDate: now,
    })
    // The throttled write is also a mirror refresh: an active session's
    // mirror stamp stays at most one persist interval stale, so the worker
    // can never sweep grants for a live wallet — while a session killed
    // after this point still leaves an aging stamp the worker sweeps
    // across restarts.
    stampWalletLock(now)
    lastPersistedActivityRef.current = now
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
    // Seed the persist throttle from the persisted clock: the first
    // activity after mount only rewrites the registry once the stored
    // clock is more than one persist interval stale.
    lastPersistedActivityRef.current =
      LocalStorageService.getItem(accountRegistryName)?.logoutDate ?? 0

    // OPEN pages never fire pagehide, so the 30-minute auto-lock must also
    // be enforced here. The lock decision keys on the SHARED persisted
    // clock (registry.logoutDate), never on this surface's own activity:
    // every surface's throttled persist refreshes it, so a surface idle in
    // its own right cannot lock a wallet the user is actively using in
    // another one — and the stamp below stays an already-aged clock, so a
    // lost notify is swept by the worker immediately. Same
    // rounded-whole-minutes rule as checkAccountLockState and the worker's
    // mirror sweep; a stampless legacy registry locks through
    // checkAccountLockState's fail-closed path instead.
    const lockCheckInterval = setInterval(() => {
      const registry = LocalStorageService.getItem(accountRegistryName)
      if (!registry?.logoutDate) return
      const idleMinutes = differenceInMinutes(
        new Date(),
        new Date(registry.logoutDate),
        { roundingMethod: 'ceil' },
      )
      if (idleMinutes < LOGIN_TIMEOUT_MINUTES) return
      lockWallet(registry.logoutDate)
      // Clear the in-page session so every consumer re-renders locked — the
      // app entry derives its chrome from the cleared addresses. Routes
      // only change when the user next navigates.
      setAddresses('')
      setAccountID('')
      setAccountName('')
    }, LOCK_CHECK_INTERVAL_MS)

    window.addEventListener('pagehide', setLoginTimeoutLimit)
    window.addEventListener('pointerdown', markUserActivity)
    window.addEventListener('keydown', markUserActivity)
    window.addEventListener('wheel', markUserActivity)

    return () => {
      clearInterval(lockCheckInterval)
      window.removeEventListener('pagehide', setLoginTimeoutLimit)
      window.removeEventListener('pointerdown', markUserActivity)
      window.removeEventListener('keydown', markUserActivity)
      window.removeEventListener('wheel', markUserActivity)
    }
  }, [])

  return (
    <AccountContext.Provider value={propValue || value}>
      {children}
    </AccountContext.Provider>
  )
}

export { AccountContext, AccountProvider }
