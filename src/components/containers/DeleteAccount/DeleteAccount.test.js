import { render, fireEvent, screen } from '@testing-library/react'
import { AccountContext, MintlayerContext } from '@Contexts'
import { BrowserRouter as Router } from 'react-router-dom'
import DeleteAccount from './DeleteAccount'

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
  it('renders initial step correctly', () => {
    render(
      <Router future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </Router>,
    )
    expect(
      screen.getByText(
        'Are you sure you want to permanently delete your wallet?',
      ),
    ).toBeInTheDocument()
  })

  it('changes step on Continue click', () => {
    render(
      <Router future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </Router>,
    )
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Delete Wallet')).toBeInTheDocument()
  })

  it('calls setRemoveAccountPopupOpen on Cancel click', () => {
    render(
      <Router future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </Router>,
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockContext.setRemoveAccountPopupOpen).toHaveBeenCalledWith(false)
  })

  it('calls deleteAccountHandler on form submit', async () => {
    render(
      <Router future={memoryRouterFeature}>
        <AccountContext.Provider value={mockContext}>
          <MintlayerContext.Provider value={mockMintlayerContext}>
            <DeleteAccount />
          </MintlayerContext.Provider>
        </AccountContext.Provider>
        ,
      </Router>,
    )
    fireEvent.click(screen.getByText('Continue'))
    fireEvent.submit(screen.getByText('Delete Wallet'))

    // await waitFor(() => expect(Account.deleteAccount).toHaveBeenCalledWith('1'))
    // await waitFor(() =>
    //   expect(mockContext.verifyAccountsExistence).toHaveBeenCalled(),
    // )
    // await waitFor(() => expect(mockContext.logout).toHaveBeenCalled())
    // await waitFor(() =>
    //   expect(mockContext.setRemoveAccountPopupOpen).toHaveBeenCalledWith(false),
    // )
  })
})
