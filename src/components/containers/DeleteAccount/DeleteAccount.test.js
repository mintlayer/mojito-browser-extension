import { useContext, useEffect } from 'react'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { AccountContext, AccountProvider, MintlayerContext } from '@Contexts'
import { BrowserRouter } from 'react-router'
import DeleteAccount from './DeleteAccount'

// Keep the output readable: swallow React's act() noise from the async
// delete flow (and the deliberate console.error from the failure paths).
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

afterAll(() => {
  errorSpy.mockRestore()
})

const mockNotifyWalletLocked = jest.fn()
const mockStampWalletLock = jest.fn()
const mockGetItem = jest.fn()
const mockSetItem = jest.fn()
const mockRemoveItem = jest.fn()
const mockUnlockAccount = jest.fn()
const mockDeleteAccount = jest.fn()
const mockLoadAccounts = jest.fn()
const mockGetAll = jest.fn()

jest.mock('@Browser', () => ({
  ...jest.requireActual('@Browser'),
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

jest.mock('@Entities', () => ({
  __esModule: true,
  ...jest.requireActual('@Entities'),
  Account: {
    ...jest.requireActual('@Entities').Account,
    unlockAccount: (...args) => mockUnlockAccount(...args),
    deleteAccount: (...args) => mockDeleteAccount(...args),
  },
}))

// verifyAccountsExistence reads the accounts store through AppInfo →
// IndexedDB; intercepting loadAccounts lets a test make the post-delete
// verification fail the way a broken/unavailable IndexedDB does.
jest.mock('@Databases', () => {
  const actual = jest.requireActual('@Databases')
  return {
    __esModule: true,
    ...actual,
    IndexedDB: {
      ...actual.IndexedDB,
      loadAccounts: (...args) => mockLoadAccounts(...args),
      getAll: (...args) => mockGetAll(...args),
    },
  }
})

const mockContext = {
  logout: jest.fn(),
  verifyAccountsExistence: jest.fn(),
  deletingAccount: { id: '1', addresses: ['address1'] },
  setRemoveAccountPopupOpen: jest.fn(),
}

const mockMintlayerContext = {
  setAllDataFetching: jest.fn(),
}

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

describe('DeleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial step correctly', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </BrowserRouter>,
    )
    expect(screen.getByText('Delete wallet permanently?')).toBeInTheDocument()
  })

  it('changes step on Delete wallet click after confirming checkboxes', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </BrowserRouter>,
    )
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    fireEvent.click(screen.getByText('Delete wallet'))
    expect(screen.getByText('Delete Wallet')).toBeInTheDocument()
  })

  it('calls setRemoveAccountPopupOpen on Cancel click', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </BrowserRouter>,
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockContext.setRemoveAccountPopupOpen).toHaveBeenCalledWith(false)
  })

  it('disables delete button until both checkboxes are checked', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </BrowserRouter>,
    )
    const deleteBtn = screen.getByText('Delete wallet').closest('button')
    expect(deleteBtn).toBeDisabled()

    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(deleteBtn).toBeDisabled()

    fireEvent.click(checkboxes[1])
    expect(deleteBtn).not.toBeDisabled()
  })
})

/**
 * Regression test (grant revocation):
 * not-revoked: deleting the wallet must revoke its dApp connection grants —
 * via logout (AccountProvider.logout), which clears the unlockedAccount
 * registry, stamps the lock mirror to chrome.storage.local ('walletLockAt',
 * the durable witness the worker sweeps when a message is lost) and only
 * then sends the walletLocked notify the background answers by revoking
 * every grant. These tests render the REAL AccountProvider so the whole
 * chain is exercised; the background's own leg (walletLocked → grants gone)
 * is pinned in src/background/main.test.js. A FAILED delete (IndexedDB
 * rejects) must keep the session and grants — revocation is tied to the
 * COMPLETED delete only.
 */
describe('DeleteAccount delete → grant revocation (logout notify)', () => {
  // Seeds the deletingAccount state the real provider starts without.
  const SeedDeletingAccount = () => {
    const { setDeletingAccount } = useContext(AccountContext)
    useEffect(() => {
      setDeletingAccount({ id: 'acc-1', name: 'Main' })
    }, [setDeletingAccount])
    return null
  }

  const renderDeleteFlow = () =>
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <AccountProvider>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <SeedDeletingAccount />
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountProvider>
      </BrowserRouter>,
    )

  // Step 1 (confirmations) → step 2 (password) → submit.
  const submitDeleteFlow = () => {
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    fireEvent.click(checkboxes[1])
    fireEvent.click(screen.getByText('Delete wallet'))
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password1234' },
    })
    fireEvent.click(screen.getByTestId('login-password-submit'))
  }

  beforeEach(() => {
    // this describe has its own mock wiring: clear the calls the first
    // describe's tests accumulated, then set the happy-path defaults
    jest.clearAllMocks()
    mockUnlockAccount.mockResolvedValue({
      addresses: { mlAddress: 'addr' },
    })
    mockLoadAccounts.mockResolvedValue({})
    mockGetAll.mockResolvedValue([])
  })

  it('completing the delete flow fires the lock notify: mirror stamped before it, registry cleared', async () => {
    renderDeleteFlow()
    submitDeleteFlow()

    await waitFor(() => expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1))

    expect(mockDeleteAccount).toHaveBeenCalledWith('acc-1')
    expect(mockRemoveItem).toHaveBeenCalledWith('unlockedAccount')
    // the mirror lands BEFORE the notify: a lost message still gets the
    // grants swept on the worker's next boot
    expect(mockStampWalletLock).toHaveBeenCalledWith(expect.any(Number))
    expect(mockStampWalletLock.mock.invocationCallOrder[0]).toBeLessThan(
      mockNotifyWalletLocked.mock.invocationCallOrder[0],
    )
  })

  it('a post-delete failure (accounts verification throws) must not skip the revocation', async () => {
    // The wallet data is already gone when the follow-up accounts read
    // fails: logout must have fired BEFORE that failure could swallow it.
    mockLoadAccounts.mockRejectedValueOnce(new Error('IndexedDB unavailable'))

    renderDeleteFlow()
    submitDeleteFlow()

    await waitFor(() => expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1))
    expect(mockDeleteAccount).toHaveBeenCalledWith('acc-1')
    expect(mockStampWalletLock).toHaveBeenCalledWith(expect.any(Number))
    // same mirror-before-notify parity as the happy path: a lost message
    // still gets the grants swept at the worker's next boot
    expect(mockStampWalletLock.mock.invocationCallOrder[0]).toBeLessThan(
      mockNotifyWalletLocked.mock.invocationCallOrder[0],
    )
  })

  it('a failed delete (IndexedDB rejects) must not revoke and must surface the failure', async () => {
    mockDeleteAccount.mockRejectedValueOnce(new Error('delete failed'))

    renderDeleteFlow()
    submitDeleteFlow()

    // the failure is surfaced instead of leaving the user on the permanent
    // loading screen, and NO revocation fired: the wallet still exists, the
    // session stays unlocked, the grants keep answering
    await screen.findByText(/something went wrong while deleting your wallet/i)
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    expect(mockStampWalletLock).not.toHaveBeenCalled()
    expect(mockRemoveItem).not.toHaveBeenCalled()

    // Back gives a fresh password form (SetPassword's own loading state is
    // gone) and a successful retry completes the revocation
    fireEvent.click(screen.getByText('Back'))
    fireEvent.change(await screen.findByPlaceholderText('Password'), {
      target: { value: 'password1234' },
    })
    mockDeleteAccount.mockResolvedValueOnce(undefined)
    fireEvent.click(screen.getByTestId('login-password-submit'))
    await waitFor(() => expect(mockNotifyWalletLocked).toHaveBeenCalledTimes(1))
  })

  it('a wrong password starts no delete and revokes nothing', async () => {
    mockUnlockAccount.mockRejectedValueOnce(new Error('bad password'))

    renderDeleteFlow()
    submitDeleteFlow()

    await screen.findByText('Incorrect password')
    expect(mockDeleteAccount).not.toHaveBeenCalled()
    expect(mockNotifyWalletLocked).not.toHaveBeenCalled()
    expect(mockStampWalletLock).not.toHaveBeenCalled()
  })
})
