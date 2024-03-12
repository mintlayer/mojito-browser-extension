import { render, fireEvent, screen } from '@testing-library/react'
import { TransactionContext, SettingsContext } from '@Contexts'
import DelegationDetails, { DelegationDetailsItem } from './DelegationDetails'

describe('DelegationDetailsItem', () => {
  it('renders correctly', () => {
    render(
      <DelegationDetailsItem
        title="Test Title"
        content="Test Content"
      />,
    )
    expect(
      screen.getByTestId('delegation-details-item-title'),
    ).toHaveTextContent('Test Title')
    expect(
      screen.getByTestId('delegation-details-item-content'),
    ).toHaveTextContent('Test Content')
  })
})

describe('DelegationDetails', () => {
  const mockSetDelegationStep = jest.fn()
  const mockSetTransactionMode = jest.fn()
  const mockSetCurrentDelegationInfo = jest.fn()

  const mockTransactionContext = {
    setDelegationStep: mockSetDelegationStep,
    setTransactionMode: mockSetTransactionMode,
    setCurrentDelegationInfo: mockSetCurrentDelegationInfo,
  }

  const mockSettingsContext = {
    networkType: 'testnet',
  }

  const mockDelegation = {
    date: 1645113600,
    balance: 100000000,
    spend_destination: 'test_address',
    delegation_id: 'test_id',
  }

  it('renders correctly', () => {
    render(
      <TransactionContext.Provider value={mockTransactionContext}>
        <SettingsContext.Provider value={mockSettingsContext}>
          <DelegationDetails delegation={mockDelegation} />
        </SettingsContext.Provider>
      </TransactionContext.Provider>,
    )

    expect(screen.getByTestId('delegation-details')).toBeInTheDocument()
  })

  it('calls correct functions on button click', () => {
    render(
      <TransactionContext.Provider value={mockTransactionContext}>
        <SettingsContext.Provider value={mockSettingsContext}>
          <DelegationDetails delegation={mockDelegation} />
        </SettingsContext.Provider>
      </TransactionContext.Provider>,
    )

    fireEvent.click(screen.getByText('Add funds'))
    expect(mockSetCurrentDelegationInfo).toHaveBeenCalledWith(mockDelegation)
    expect(mockSetTransactionMode).toHaveBeenCalledWith('staking')
    expect(mockSetDelegationStep).toHaveBeenCalledWith(2)

    fireEvent.click(screen.getByText('Withdraw'))
    expect(mockSetCurrentDelegationInfo).toHaveBeenCalledWith(mockDelegation)
    expect(mockSetTransactionMode).toHaveBeenCalledWith('withdraw')
    expect(mockSetDelegationStep).toHaveBeenCalledWith(2)
  })
})
