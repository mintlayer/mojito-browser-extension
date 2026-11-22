/**
 * Tests for the AccountProvider lock/logout leg of the dApp-grant revocation
 * contract: every lock path (manual logout, 30-minute auto-lock expiry on a
 * reopened page, and the in-page inactivity interval for an OPEN page) must
 * clear the unlockedAccount registry AND tell the background (which cannot
 * read this localStorage), while live sessions must stay silent. The idle
 * clock is additionally mirrored to chrome.storage.local ('walletLockAt') so
 * the worker can sweep grants even when no wallet page is open to observe
 * the expiry.
 *
 * jest.isolateModules gives each test a fresh provider module. The render
 * harness (react, the test renderer, the provider) is required INSIDE the
 * sandbox so hooks see a single react copy. RTL registers jest hooks at
 * require time — legal at module scope, but this sandbox require happens
 * inside a running test (jest-circus rejects hooks there) — so this copy
 * skips auto-cleanup (RTL_SKIP_AUTO_CLEANUP, deleted right after the require
 * so the flag cannot leak to other test files), and the module below hand-
 * manages the unmount and IS_REACT_ACT_ENVIRONMENT (what RTL's skipped
 * beforeAll would have set).
 */
const mockNotifyWalletLocked = jest.fn()
const mockStampWalletLock = jest.fn()
const mockGetItem = jest.fn()
const mockSetItem = jest.fn()
const mockRemoveItem = jest.fn()

jest.mock('@Browser', () => ({
  notifyWalletLocked: (...args) => mockNotifyWalletLocked(...args),
  stampWalletLock: (...args) => mockStampWalletLock(...args),
}))

jest.mock('@Storage', () => ({
  LocalStorageService: {
    getItem: (...args) => mockGetItem(...args),
    setItem: (...args) => mockSetItem(...args),
    removeItem: (...args) => mockRemoveItem(...args),
  },
}))

// what RTL's skipped beforeAll would have set — React 19 needs it for act()
globalThis.IS_REACT_ACT_ENVIRONMENT = true

let mountedCleanup = null
afterEach(() => {
  if (mountedCleanup) {
    mountedCleanup()
    mountedCleanup = null
  }
})

const loadAccountProvider = () => {
  let harness
  jest.isolateModules(() => {
    process.env.RTL_SKIP_AUTO_CLEANUP = 'true'
    const react = require('react')
    const { render, act, cleanup } = require('@testing-library/react')
    delete process.env.RTL_SKIP_AUTO_CLEANUP

    const { AccountContext, AccountProvider } = require('./AccountProvider')

    // Mounts the provider and captures its context value through a probe
    // child — the lock/logout functions are closures created inside the
    // component, so exercising them needs a real render.
    const captureContextValue = () => {
      let captured
      const Probe = () => {
        captured = react.useContext(AccountContext)
        return null
      }
      render(
        react.createElement(AccountProvider, null, react.createElement(Probe)),
      )
      return captured
    }

    // Same probe, but returns a LIVE accessor: captureContextValue returns
    // the mount-time snapshot, while this re-reads after act() has let the
    // provider re-render (needed for interval-driven state changes).
    const captureLiveContextValue = () => {
      let captured
      const Probe = () => {
        captured = react.useContext(AccountContext)
        return null
      }
      render(
        react.createElement(AccountProvider, null, react.createElement(Probe)),
      )
      return () => captured
    }

    mountedCleanup = cleanup
    const { LOGIN_TIMEOUT_MINUTES } = require('@Constants')
    harness = {
      captureContextValue,
      captureLiveContextValue,
      act,
      loginTimeoutMinutes: LOGIN_TIMEOUT_MINUTES,
    }
  })
  return harness
}

const unlockedAccount = (logoutDate) => ({
  addresses: 'addr',
  id: 'acc-1',
  name: 'Main',
  ...(logoutDate == null ? {} : { logoutDate }),
})

describe('AccountProvider lock/logout notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logout clears the registry and notifies the background', () => {
    const { captureContextValue, act, loginTimeoutMinutes } =
      loadAccountProvider()
    const value = captureContextValue()

    act(() => {
      value.logout()
    })

    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
    // logout also stamps the lock mirror, ALREADY-EXPIRED (fail-closed, the
    // same pattern as the stampless-registry branch): a lost notify is
    // swept at the worker's next boot immediately — never a fresh
    // 30-minute mirror TTL for revoked-bound grants. The next unlock
    // re-stamps the mirror fresh before any new grant can exist.
    expect(mockStampWalletLock).toHaveBeenCalledWith(expect.any(Number))
    const [stampedAt] = mockStampWalletLock.mock.calls[0]
    expect(stampedAt).toBeLessThanOrEqual(
      Date.now() - loginTimeoutMinutes * 60 * 1000,
    )
  })

  it('an expired registry locks: clears the registry, stamps the mirror, notifies', () => {
    const logoutDate = Date.now() - 31 * 60 * 1000
    mockGetItem.mockReturnValue(unlockedAccount(logoutDate))
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    let unlocked
    act(() => {
      unlocked = value.isAccountUnlocked(false)
    })

    expect(unlocked).toBe(false)
    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    // the stamp is the durable witness (survives a lost notify) and carries
    // the ORIGINAL pagehide timestamp, not now
    expect(mockStampWalletLock).toHaveBeenCalledWith(logoutDate)
    // stamped BEFORE the notify: the mirror is durable before the best-effort
    // message leaves the page (same ordering as logout)
    expect(mockStampWalletLock.mock.invocationCallOrder[0]).toBeLessThan(
      mockNotifyWalletLocked.mock.invocationCallOrder[0],
    )
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
  })

  it('a registry inside the timeout resumes: no notify, mirror re-stamped with the registry clock', () => {
    const logoutDate = Date.now() - 5 * 60 * 1000
    mockGetItem.mockReturnValue(unlockedAccount(logoutDate))
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    let unlocked
    act(() => {
      unlocked = value.isAccountUnlocked(false)
    })

    expect(unlocked).toBe(true)
    expect(mockRemoveItem).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    // resumed before expiry: the mirror must hold the SAME idle clock the
    // registry does — a pagehide-stamped mirror must not expire while an
    // open, unlocked wallet is live, and a NUMBER stamp keeps aging if the
    // session is later hard-killed without a pagehide (never a permanent
    // null the worker could never sweep across restarts)
    expect(mockStampWalletLock).toHaveBeenCalledWith(logoutDate)
  })

  it('a registry without an idle clock fails closed: locks and notifies', () => {
    // Only reachable for a registry written by a pre-fix build (unlock now
    // always stamps the clock): the session's age is unknown, so it must
    // lock, not stay open.
    mockGetItem.mockReturnValue(unlockedAccount())
    const { captureContextValue, act, loginTimeoutMinutes } =
      loadAccountProvider()
    const value = captureContextValue()

    let unlocked
    act(() => {
      unlocked = value.isAccountUnlocked(false)
    })

    expect(unlocked).toBe(false)
    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    // the unknown-age session must stamp an ALREADY-EXPIRED mirror, so a
    // lost notify is swept immediately — never a fresh 30-minute TTL
    const [stampedAt] = mockStampWalletLock.mock.calls[0]
    expect(stampedAt).toBeLessThanOrEqual(
      Date.now() - loginTimeoutMinutes * 60 * 1000,
    )
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
  })

  it('unlocking stamps the idle clock and mirrors it as a number (never null)', () => {
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    act(() => {
      value.setWalletInfo(['addr'], 'acc-1', 'Main')
    })

    // The idle clock is stamped AT unlock: it is what makes a page killed
    // before any pagehide age out on reopen.
    const [registryKey, stored] = mockSetItem.mock.calls[0]
    expect(registryKey).toBe('unlockedAccount')
    expect(stored.logoutDate).toEqual(expect.any(Number))
    // the mirror carries the SAME fresh clock: a stale expired mirror must
    // not sweep the new session's grants, and a hard kill (no pagehide)
    // leaves an AGING stamp the worker sweeps after the lock deadline —
    // never a permanent null
    expect(mockStampWalletLock).toHaveBeenCalledWith(stored.logoutDate)
    // the stamp lands BEFORE the registry write: a page killed between the
    // two writes must not leave the previous session's EXPIRED mirror
    // witnessing against the new session's grants at the next worker boot
    expect(mockStampWalletLock.mock.invocationCallOrder[0]).toBeLessThan(
      mockSetItem.mock.invocationCallOrder[0],
    )
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
  })

  it('pagehide stamps the idle clock and mirrors it for the worker', () => {
    mockGetItem.mockReturnValue(unlockedAccount())
    const { captureContextValue, act } = loadAccountProvider()
    captureContextValue()

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    // the provider removes its pagehide listener on unmount, so only this
    // test's mount handler fires
    expect(mockSetItem).toHaveBeenCalled()
    const [, stored] = mockSetItem.mock.calls.at(-1)
    expect(stored.logoutDate).toEqual(expect.any(Number))
    // the mirror carries the SAME timestamp the registry was stamped with —
    // the worker applies the same 30-minute constant to it
    expect(mockStampWalletLock).toHaveBeenLastCalledWith(stored.logoutDate)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
  })
})

// The in-page inactivity auto-lock: an OPEN page never fires pagehide, so a
// 30-second interval watches the idle clock and locks through the same
// revoke path (registry clear + mirror stamp + notify) when it expires.
describe('AccountProvider open-page inactivity auto-lock', () => {
  const registryKey = 'unlockedAccount'
  let registryStore

  const seedRegistry = (logoutDate) =>
    registryStore.set(registryKey, unlockedAccount(logoutDate))

  beforeEach(() => {
    jest.resetAllMocks()
    jest.useFakeTimers()
    // Model localStorage's read-after-remove reality: the interval keeps
    // ticking, so a locked wallet must look GONE from the registry, not
    // merely flagged.
    registryStore = new Map()
    mockGetItem.mockImplementation((key) => registryStore.get(key) ?? null)
    mockSetItem.mockImplementation((key, val) => registryStore.set(key, val))
    mockRemoveItem.mockImplementation((key) => registryStore.delete(key))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('an open page auto-locks after 30 minutes without activity', () => {
    const mountTime = Date.now()
    // live session, 5 minutes already idle
    seedRegistry(mountTime - 5 * 60 * 1000)
    const { captureLiveContextValue, act } = loadAccountProvider()
    const getValue = captureLiveContextValue()

    // advance past the 30-minute boundary (rounded whole minutes, the same
    // rule the worker sweep applies to the mirror)
    act(() => {
      jest.advanceTimersByTime(26 * 60 * 1000)
    })

    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    // the mirror carries the ORIGINAL idle clock, not the lock moment —
    // it is already expired, so the worker sweeps grants immediately
    expect(mockStampWalletLock).toHaveBeenCalledWith(mountTime - 5 * 60 * 1000)
    expect(mockStampWalletLock.mock.invocationCallOrder[0]).toBeLessThan(
      mockNotifyWalletLocked.mock.invocationCallOrder[0],
    )
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
    // the open UI reflects the lock: the in-page session state is cleared
    expect(getValue().addresses).toBe('')
    expect(getValue().accountID).toBe('')
    expect(getValue().accountName).toBe('')
  })

  it('user activity inside the window resets the timer: no lock until idle again', () => {
    const mountTime = Date.now()
    seedRegistry(mountTime)
    const { captureLiveContextValue, act } = loadAccountProvider()
    captureLiveContextValue()

    // 29 idle minutes: inside the window, no lock
    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000)
    })
    expect(mockRemoveItem).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()

    // user activity resets the clock — and persists the refreshed registry
    // clock a killed page would reopen with
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    const [, stored] = mockSetItem.mock.calls.at(-1)
    expect(stored.logoutDate).toBe(mountTime + 29 * 60 * 1000)

    // another 29 idle minutes: still inside the refreshed window
    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000)
    })
    expect(mockRemoveItem).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()

    // once the refreshed clock itself goes idle, the lock fires
    act(() => {
      jest.advanceTimersByTime(29 * 60 * 1000 + 30 * 1000)
    })
    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
  })

  it('a page killed before any pagehide locks on reopen once its clock expires', () => {
    const mountTime = Date.now()
    // unclean kill: no pagehide was ever stamped — the registry still holds
    // the clock persisted at the last unlock/activity refresh, 31 min ago
    seedRegistry(mountTime - 31 * 60 * 1000)
    const { captureLiveContextValue, act } = loadAccountProvider()
    const getValue = captureLiveContextValue()

    // no isAccountUnlocked call at all — the provider's own interval locks
    act(() => {
      jest.advanceTimersByTime(30 * 1000)
    })

    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    expect(mockStampWalletLock).toHaveBeenCalledWith(mountTime - 31 * 60 * 1000)
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
    expect(getValue().addresses).toBe('')
  })

  it('a reopen inside the timeout resumes and keeps its accrued idle clock', () => {
    const mountTime = Date.now()
    seedRegistry(mountTime - 20 * 60 * 1000)
    const { captureLiveContextValue, act } = loadAccountProvider()
    const getValue = captureLiveContextValue()

    let unlocked
    act(() => {
      unlocked = getValue().isAccountUnlocked(false)
    })
    // resume-inside-timeout branch: unlocked, mirror re-stamped with the
    // registry's accrued idle clock (a NUMBER, never null)
    expect(unlocked).toBe(true)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    expect(mockStampWalletLock).toHaveBeenCalledWith(mountTime - 20 * 60 * 1000)

    // 9 more minutes: still inside the window, no lock
    act(() => {
      jest.advanceTimersByTime(9 * 60 * 1000)
    })
    expect(mockRemoveItem).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()

    // crossing the ORIGINAL clock's boundary locks — the mount did not
    // grant a fresh 30-minute window
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000)
    })
    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    expect(mockStampWalletLock).toHaveBeenLastCalledWith(
      mountTime - 20 * 60 * 1000,
    )
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
  })

  it('activity persist is throttled; pointerdown, keydown and wheel all refresh the clock', () => {
    const mountTime = Date.now()
    seedRegistry(mountTime)
    const { captureLiveContextValue, act } = loadAccountProvider()
    captureLiveContextValue()

    // pointerdown past the throttle window persists the refreshed clock
    act(() => {
      jest.advanceTimersByTime(61 * 1000)
    })
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    expect(mockSetItem).toHaveBeenCalledTimes(1)
    expect(registryStore.get(registryKey).logoutDate).toBe(
      mountTime + 61 * 1000,
    )

    // keydown INSIDE the persist window must not rewrite the registry
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      window.dispatchEvent(new Event('keydown'))
    })
    expect(mockSetItem).toHaveBeenCalledTimes(1)

    // wheel after the window persists again — each input path refreshes the
    // shared clock the lock decision keys on
    act(() => {
      jest.advanceTimersByTime(61 * 1000)
    })
    act(() => {
      window.dispatchEvent(new Event('wheel'))
    })
    expect(mockSetItem).toHaveBeenCalledTimes(2)
    expect(registryStore.get(registryKey).logoutDate).toBe(
      mountTime + 123 * 1000,
    )
    // the clock never went idle long enough to lock
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
  })

  it('the throttled activity persist refreshes the lock mirror with the same clock', () => {
    const mountTime = Date.now()
    seedRegistry(mountTime)
    const { captureLiveContextValue, act } = loadAccountProvider()
    captureLiveContextValue()

    // a persist past the throttle window stamps the mirror with the SAME
    // refreshed clock it wrote to the registry: an active session's mirror
    // stamp is at most one persist interval stale, so the worker can never
    // false-sweep a live wallet
    act(() => {
      jest.advanceTimersByTime(61 * 1000)
    })
    act(() => {
      window.dispatchEvent(new Event('pointerdown'))
    })
    expect(registryStore.get(registryKey).logoutDate).toBe(
      mountTime + 61 * 1000,
    )
    expect(mockStampWalletLock).toHaveBeenLastCalledWith(mountTime + 61 * 1000)

    // a throttle-SUPPRESSED activity persists nothing and must not stamp
    // the mirror either — the mirror only ever moves with the registry
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      window.dispatchEvent(new Event('keydown'))
    })
    expect(mockSetItem).toHaveBeenCalledTimes(1)
    expect(mockStampWalletLock).toHaveBeenLastCalledWith(mountTime + 61 * 1000)
  })
})
