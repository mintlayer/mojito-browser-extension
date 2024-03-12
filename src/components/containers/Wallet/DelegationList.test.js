import { render, screen } from '@testing-library/react'
import { TransactionContext } from '@Contexts'
import DelegationList from './DelegationList'

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
      <TransactionContext.Provider value={{ delegationsLoading: true }}>
        <DelegationList delegationsList={mockDelegationsList} />
      </TransactionContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('card')).toHaveLength(3)
  })

  it('renders correctly when there are no delegations', () => {
    render(
      <TransactionContext.Provider value={{ delegationsLoading: false }}>
        <DelegationList delegationsList={[]} />
      </TransactionContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    expect(
      screen.getByText('No Delegations in this wallet'),
    ).toBeInTheDocument()
  })

  it('renders correctly when there are delegations', () => {
    render(
      <TransactionContext.Provider value={{ delegationsLoading: false }}>
        <DelegationList delegationsList={mockDelegationsList} />
      </TransactionContext.Provider>,
    )

    expect(screen.getByTestId('delegation-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('delegation')).toHaveLength(2)
  })
})
