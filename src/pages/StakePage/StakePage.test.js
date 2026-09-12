import React from 'react'
import { MemoryRouter } from 'react-router'
import { render } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

jest.mock('@Hooks', () => ({
  __esModule: true,
  useMlWalletInfo: () => ({
    transactions: [
      {
        type: 'DelegateStaking',
        direction: 'out',
        value: 500,
        date: 1700000000,
        txid: 's1',
      },
      {
        type: 'DelegateStaking',
        direction: 'out',
        value: 250,
        date: 1700100000,
        txid: 's2',
      },
      {
        type: 'Delegate Withdrawal',
        direction: 'in',
        value: 100,
        date: 1700200000,
        txid: 'w1',
      },
      {
        type: 'Transfer',
        direction: 'in',
        value: 5,
        date: 1700300000,
        txid: 't1',
      },
    ],
  }),
  useOnClickOutside: () => {},
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({}),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
    BitcoinContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    MintlayerContext: makeCtx({
      // contributed 750 - withdrawn 100 = 650 net; live total 660 => earned 10
      mlDelegationsBalance: 660,
      fetchingDelegations: false,
      mlDelegationList: [
        {
          delegation_id: 'mdelg1234567890123456789012345',
          pool_id: 'mpool1234567890123456789012345',
          balance: { atoms: '50000000000', decimal: '500' },
          spend_destination: 'mtc1qtest',
          creation_time: 1700000000,
          decommissioned: false,
        },
        {
          delegation_id: 'mdelg9876543210987654321098765',
          pool_id: 'mpool9876543210987654321098765',
          balance: { atoms: '15000000000', decimal: '150' },
          spend_destination: 'mtc1qtest',
          creation_time: 1700100000,
          decommissioned: true,
        },
      ],
    }),
  }
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <StakePage />
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const StakePage = require('./StakePage').default

describe('StakePage', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('renders total staked, earned rewards and delegation counts', () => {
    const { container } = renderPage()

    expect(container.textContent).toContain('Total staked')
    expect(container.textContent).toContain('660')
    expect(container.textContent).toContain('+10')
    expect(container.textContent).toContain('1 active')
    expect(container.textContent).toContain('1 inactive')
  })

  it('renders the stake growth chart from the staking transactions', () => {
    const { getByTestId } = renderPage()

    // 0 -> 500 -> 750 -> 650 (withdrawal), anchored to live total 660
    expect(getByTestId('sparkline')).toBeInTheDocument()
  })

  it('renders the delegation list and only the explorer pool list action', () => {
    const { container, getAllByTestId } = renderPage()

    expect(getAllByTestId('delegation')).toHaveLength(2)
    expect(container.textContent).toContain('Pool list')
    // Delegation management happens on the explorer, not in the app.
    expect(container.textContent).not.toContain('Create delegation')
    expect(container.textContent).not.toContain('Staking guide')
  })
})
