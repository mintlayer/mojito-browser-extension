import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import Delegation from './Delegation'
import {
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
} from '@Contexts'
import { LocalStorageService } from '@Storage'
import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'
import { format } from 'date-fns'
import { BrowserRouter } from 'react-router'

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
    balance: { decimal: '10', atoms: '1000000000000' },
    pool_id: 'test_id',
  }

  const date = mockDelegation.creation_time
    ? format(new Date(mockDelegation.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'

  it('renders correctly', () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <BrowserRouter future={memoryRouterFeature}>
              <Delegation delegation={mockDelegation} />
            </BrowserRouter>
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
      mockDelegation.balance.decimal,
    )
  })

  it('opens and closes the detail popup correctly', async () => {
    render(
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <BrowserRouter future={memoryRouterFeature}>
              <Delegation delegation={mockDelegation} />
            </BrowserRouter>
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>,
    )

    fireEvent.click(screen.getByTestId('delegation'))
    expect(screen.getByTestId('delegation-details')).toBeInTheDocument()

    // close via the popup's close button (first button inside the popup)
    fireEvent.click(screen.getAllByTestId('button')[0])

    // the popup unmounts after its closing animation
    await waitFor(
      () => {
        expect(
          screen.queryByTestId('delegation-details'),
        ).not.toBeInTheDocument()
      },
      { timeout: 1500 },
    )
  })
})
