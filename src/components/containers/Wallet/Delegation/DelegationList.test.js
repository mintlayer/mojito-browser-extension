import { render, screen } from '@testing-library/react'
import { TransactionContext, AccountContext, SettingsContext } from '@Contexts'
import DelegationList from './DelegationList'
import { LocalStorageService } from '@Storage'
import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'
import { BrowserRouter } from 'react-router'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('unlockedAccount', { name: 'test' })

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

describe('DelegationList', () => {
  const mockDelegationsList = [
    {
      date: 1645113600,
      balance: 100000000,
      delegation_id: 'test_id1',
    },
    {
      date: 1645113600,
      balance: 200000000,
      delegation_id: 'test_id2',
    },
  ]

  it('renders correctly when delegations are loading', () => {
    render(
      <AccountContext.Provider value={{ accountName: 'test' }}>
        <SettingsContext.Provider value={{ networkType: 'testnet' }}>
          <TransactionContext.Provider value={{ delegationsLoading: true }}>
            <BrowserRouter future={memoryRouterFeature}>
              <DelegationList delegationsList={mockDelegationsList} />
            </BrowserRouter>
          </TransactionContext.Provider>
          ,
        </SettingsContext.Provider>
        ,
      </AccountContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    // There is no skeleton loader in the component. for now.
    // expect(screen.getAllByTestId('card')).toHaveLength(3)
  })

  it('renders correctly when there are no delegations', () => {
    render(
      <AccountContext.Provider value={{ accountName: 'test' }}>
        <SettingsContext.Provider value={{ networkType: 'testnet' }}>
          <TransactionContext.Provider value={{ delegationsLoading: false }}>
            <BrowserRouter future={memoryRouterFeature}>
              <DelegationList delegationsList={[]} />
            </BrowserRouter>
          </TransactionContext.Provider>
          ,
        </SettingsContext.Provider>
        ,
      </AccountContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    expect(
      screen.getByText('No Delegations in this wallet'),
    ).toBeInTheDocument()
  })

  it('renders correctly when there are delegations', () => {
    render(
      <AccountContext.Provider value={{ accountName: 'test' }}>
        <SettingsContext.Provider value={{ networkType: 'testnet' }}>
          <TransactionContext.Provider value={{ delegationsLoading: false }}>
            <BrowserRouter future={memoryRouterFeature}>
              <DelegationList delegationsList={mockDelegationsList} />
            </BrowserRouter>
          </TransactionContext.Provider>
          ,
        </SettingsContext.Provider>
        ,
      </AccountContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('delegation')).toHaveLength(2)
  })
})
