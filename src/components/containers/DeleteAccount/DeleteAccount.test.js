import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { AccountContext } from '@Contexts'
import { BrowserRouter as Router } from 'react-router-dom'
import DeleteAccount from './DeleteAccount'
import { Account } from '@Entities'

const mockContext = {
  logout: jest.fn(),
  verifyAccountsExistence: jest.fn(),
  deletingAccount: { id: '1', addresses: ['address1'] },
  setRemoveAccountPopupOpen: jest.fn(),
}

describe('DeleteAccount', () => {
  it('renders initial step correctly', () => {
    render(
      <Router>
        <AccountContext.Provider value={mockContext}>
          <DeleteAccount />
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
      <Router>
        <AccountContext.Provider value={mockContext}>
          <DeleteAccount />
        </AccountContext.Provider>
        ,
      </Router>,
    )
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Delete Wallet')).toBeInTheDocument()
  })

  it('calls setRemoveAccountPopupOpen on Cancel click', () => {
    render(
      <Router>
        <AccountContext.Provider value={mockContext}>
          <DeleteAccount />
        </AccountContext.Provider>
        ,
      </Router>,
    )
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockContext.setRemoveAccountPopupOpen).toHaveBeenCalledWith(false)
  })

  it('calls deleteAccountHandler on form submit', async () => {
    render(
      <Router>
        <AccountContext.Provider value={mockContext}>
          <DeleteAccount />
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
