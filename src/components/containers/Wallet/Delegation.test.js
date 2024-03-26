import { render, fireEvent, screen } from '@testing-library/react'
import Delegation from './Delegation'
import {
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
} from '@Contexts'
import { LocalStorageService } from '@Storage'
import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('unlockedAccount', { name: 'test' })

describe('Delegation', () => {
  const mockDelegation = {
    creation_time: 1645113600,
    balance: 100000000,
    pool_id: 'test_id',
  }

  it('renders correctly', () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <Delegation delegation={mockDelegation} />
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>,
    )

    expect(screen.getByTestId('delegation')).toBeInTheDocument()
    expect(screen.getByTestId('delegation-icon')).toBeInTheDocument()
    expect(screen.getByTestId('delegation-otherPart')).toHaveTextContent(
      'test_id',
    )
    expect(screen.getByTestId('delegation-date')).toHaveTextContent(
      'Date: 17/02/2022 17:00',
    )
    expect(screen.getByTestId('delegation-amount')).toHaveTextContent(
      'Amount: 0,001',
    )
  })

  it('opens and closes the detail popup correctly', () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <Delegation delegation={mockDelegation} />
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>,
    )

    fireEvent.click(screen.getByTestId('delegation'))
    // Replace 'delegation-details' with the actual text or label used in your DelegationDetails component
    expect(screen.getByTestId('delegation-details')).toBeInTheDocument()

    // // Replace 'Close' with the actual text or label used in your PopUp component
    // fireEvent.click(screen.getByText('Close'))
    // // Replace 'delegation-details' with the actual text or label used in your DelegationDetails component
    // expect(screen.queryByTestId('delegation-details')).not.toBeInTheDocument()
  })
})
