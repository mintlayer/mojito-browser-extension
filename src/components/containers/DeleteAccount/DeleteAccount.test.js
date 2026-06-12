import { render, fireEvent, screen } from '@testing-library/react'
import { AccountContext, MintlayerContext } from '@Contexts'
import { BrowserRouter } from 'react-router'
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
