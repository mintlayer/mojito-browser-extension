/**
 * Tests for the AccountProvider lock/logout leg of the dApp-grant revocation
 * contract: both lock paths (manual logout, 30-minute auto-lock expiry) must
 * clear the unlockedAccount registry AND tell the background (which cannot
 * read this localStorage), while live sessions must stay silent. The lock
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

    mountedCleanup = cleanup
    harness = { captureContextValue, act }
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
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    act(() => {
      value.logout()
    })

    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1)
    // logout also stamps the lock mirror: a lost notify is still swept at
    // the worker's next boot
    expect(mockStampWalletLock).toHaveBeenCalledWith(expect.any(Number))
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

  it('a registry inside the timeout resumes: no notify, mirror cleared', () => {
    mockGetItem.mockReturnValue(unlockedAccount(Date.now() - 5 * 60 * 1000))
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    let unlocked
    act(() => {
      unlocked = value.isAccountUnlocked(false)
    })

    expect(unlocked).toBe(true)
    expect(mockRemoveItem).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    // resumed before expiry: the pagehide-stamped mirror must not make the
    // worker sweep grants for an open, unlocked wallet
    expect(mockStampWalletLock).toHaveBeenCalledWith(null)
  })

  it('a fresh unlock without an idle stamp never notifies', () => {
    mockGetItem.mockReturnValue(unlockedAccount())
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    let unlocked
    act(() => {
      unlocked = value.isAccountUnlocked(false)
    })

    expect(unlocked).toBe(true)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    expect(mockStampWalletLock).not.toHaveBeenCalled()
  })

  it('unlocking a wallet clears any stale lock mirror', () => {
    const { captureContextValue, act } = loadAccountProvider()
    const value = captureContextValue()

    act(() => {
      value.setWalletInfo(['addr'], 'acc-1', 'Main')
    })

    expect(mockSetItem).toHaveBeenCalledWith('unlockedAccount', {
      addresses: ['addr'],
      id: 'acc-1',
      name: 'Main',
    })
    expect(mockStampWalletLock).toHaveBeenCalledWith(null)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
  })

  it('pagehide stamps the idle clock and mirrors it for the worker', () => {
    mockGetItem.mockReturnValue(unlockedAccount())
    const { captureContextValue, act } = loadAccountProvider()
    captureContextValue()

    act(() => {
      window.dispatchEvent(new Event('pagehide'))
    })

    // the provider never removes its pagehide listener, so earlier mounts in
    // this suite fire too — the LAST handler is this test's mount
    expect(mockSetItem).toHaveBeenCalled()
    const [, stored] = mockSetItem.mock.calls.at(-1)
    expect(stored.logoutDate).toEqual(expect.any(Number))
    // the mirror carries the SAME timestamp the registry was stamped with —
    // the worker applies the same 30-minute constant to it
    expect(mockStampWalletLock).toHaveBeenLastCalledWith(stored.logoutDate)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
  })
})
