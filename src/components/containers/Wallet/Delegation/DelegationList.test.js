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
      creation_time: 1645113600,
      balance: { decimal: '100', atoms: '10000000000' },
      delegation_id: 'test_id1',
      pool_id: 'pool_id1',
      type: 'Confirmed',
    },
    {
      creation_time: 1645113600,
      balance: { decimal: '200', atoms: '20000000000' },
      delegation_id: 'test_id2',
      pool_id: 'pool_id2',
      type: 'Confirmed',
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

    const amounts = screen.getAllByTestId('delegation-amount')
    expect(amounts).toHaveLength(2)
    expect(amounts[0]).toHaveTextContent('100')
    expect(amounts[1]).toHaveTextContent('200')
  })
})
