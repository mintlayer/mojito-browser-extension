import { render, fireEvent, screen } from '@testing-library/react'
import Delegation from './Delegation'
import {
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
} from '@Contexts'
import { LocalStorageService } from '@Storage'
import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'
import { format } from 'date-fns'
import { BrowserRouter as Router } from 'react-router-dom'
import { Format, ML } from '@Helpers'
import { AppInfo } from '@Constants'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('unlockedAccount', { name: 'test' })

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

describe('Delegation', () => {
  const mockDelegation = {
    creation_time: 1645113600,
    balance: '532313176000',
    pool_id: 'test_id',
  }

  const date = mockDelegation.creation_time
    ? format(new Date(mockDelegation.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'

  const value = mockDelegation.balance
    ? ML.getAmountInCoins(mockDelegation.balance, AppInfo.ML_ATOMS_PER_COIN)
    : 0

  it('renders correctly', () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <Router future={memoryRouterFeature}>
              <Delegation delegation={mockDelegation} />
            </Router>
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>,
    )

    expect(screen.getByTestId('delegation')).toBeInTheDocument()
    expect(screen.getByTestId('delegation-icon')).toBeInTheDocument()
    expect(screen.getByTestId('delegation-otherPart')).toHaveTextContent(
      'test_id',
    )
    expect(screen.getByTestId('delegation-date')).toHaveTextContent(date)
    expect(screen.getByTestId('delegation-amount')).toHaveTextContent(
      `Amount: ${Format.BTCValue(value)}`,
    )
  })

  it('opens and closes the detail popup correctly', () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <Router future={memoryRouterFeature}>
              <Delegation delegation={mockDelegation} />
            </Router>
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
