import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import AddressList from './AddressList'
import { MintlayerContext, BitcoinContext, SettingsContext } from '@Contexts'

const renderWithProviders = ({
  coinType = 'Mintlayer',
  search = '',
  networkType = 'testnet',
  mintlayer = {},
  bitcoin = {},
} = {}) => {
  const { fetchingBalances = false, addressData = [] } = mintlayer

  const { formatedAddresses = [] } = bitcoin

  const routes = [
    {
      path: '/addresses/:coinType',
      element: (
        <SettingsContext.Provider value={{ networkType }}>
          <MintlayerContext.Provider value={{ fetchingBalances, addressData }}>
            <BitcoinContext.Provider value={{ formatedAddresses }}>
              <AddressList search={search} />
            </BitcoinContext.Provider>
          </MintlayerContext.Provider>
        </SettingsContext.Provider>
      ),
    },
  ]

  const router = createMemoryRouter(routes, {
    initialEntries: [`/addresses/${coinType}`],
    future: { v7_relativeSplatPath: true },
  })

  return render(<RouterProvider router={router} />)
}

describe('AddressList', () => {
  test('renders and sorts Mintlayer addresses by used, available, locked, tokens', () => {
    const mlAddresses = [
      {
        id: 'tmt1qAAA',
        coin_balance: { decimal: 0.5 },
        locked_coin_balance: { decimal: 0.1 },
        tokens: [{ token_id: 'token-1', amount: { decimal: 1 } }],
        transaction_history: [], // used = false
      },
      {
        id: 'tmt1qBBB',
        coin_balance: { decimal: 1.2 },
        locked_coin_balance: { decimal: 0 },
        tokens: [],
        transaction_history: [1], // used = true
      },
      {
        id: 'tmt1qCCC',
        coin_balance: { decimal: 1.2 },
        locked_coin_balance: { decimal: 0.5 },
        tokens: [
          { token_id: 'token-2', amount: { decimal: 5 } },
          { token_id: 'token-3', amount: { decimal: 10 } },
        ],
        transaction_history: [], // used = false
      },
    ]

    renderWithProviders({
      coinType: 'Mintlayer',
      search: '',
      mintlayer: { fetchingBalances: false, addressData: mlAddresses },
    })

    // Expect order: used first (BBB), then by available (CCC), then (AAA)
    const row0 = screen.getByTestId('address-row-0')
    const row1 = screen.getByTestId('address-row-1')
    const row2 = screen.getByTestId('address-row-2')

    expect(within(row0).getByTitle('tmt1qBBB')).toBeInTheDocument()
    expect(within(row1).getByTitle('tmt1qCCC')).toBeInTheDocument()
    expect(within(row2).getByTitle('tmt1qAAA')).toBeInTheDocument()
  })

  test('filters Mintlayer addresses by token id substring', () => {
    const mlAddresses = [
      {
        id: 'tmt1qADDR1',
        coin_balance: { decimal: 0.1 },
        locked_coin_balance: { decimal: 0 },
        tokens: [
          { token_id: 'ABC123', amount: { decimal: 1 } },
          { token_id: 'XYZ999', amount: { decimal: 2 } },
        ],
        transaction_history: [],
      },
      {
        id: 'tmt1qADDR2',
        coin_balance: { decimal: 0.2 },
        locked_coin_balance: { decimal: 0 },
        tokens: [{ token_id: 'LMN000', amount: { decimal: 3 } }],
        transaction_history: [],
      },
    ]

    renderWithProviders({
      coinType: 'Mintlayer',
      search: 'XYZ9',
      mintlayer: { fetchingBalances: false, addressData: mlAddresses },
    })

    // Only the first address has a token id containing 'XYZ9'
    // rows include header row; we check specific rendered rows by data-testid
    const addressRow0 = screen.getByTestId('address-row-0')
    expect(within(addressRow0).getByTitle('tmt1qADDR1')).toBeInTheDocument()
    expect(screen.queryByTestId('address-row-1')).not.toBeInTheDocument()
  })

  test('renders and sorts Bitcoin addresses', () => {
    const btcAddresses = [
      {
        id: 'tb1qAAA',
        coin_balance: { available: 0.1, locked: 0 },
        tokens: [],
        used: false,
      },
      {
        id: 'tb1qBBB',
        coin_balance: { available: 1.5, locked: 0 },
        tokens: [],
        used: true,
      },
      {
        id: 'tb1qCCC',
        coin_balance: { available: 0.9, locked: 0.2 },
        tokens: [{ token_id: 'btc-token', amount: { decimal: 1 } }],
        used: false,
      },
    ]

    renderWithProviders({
      coinType: 'Bitcoin',
      bitcoin: { formatedAddresses: btcAddresses },
    })

    // Expect order: used first (BBB), then highest available (CCC), then (AAA)
    const row0 = screen.getByTestId('address-row-0')
    const row1 = screen.getByTestId('address-row-1')
    const row2 = screen.getByTestId('address-row-2')

    expect(within(row0).getByTitle('tb1qBBB')).toBeInTheDocument()
    expect(within(row1).getByTitle('tb1qCCC')).toBeInTheDocument()
    expect(within(row2).getByTitle('tb1qAAA')).toBeInTheDocument()
  })

  test('shows empty state when no addresses (Mintlayer)', () => {
    renderWithProviders({
      coinType: 'Mintlayer',
      mintlayer: { fetchingBalances: false, addressData: [] },
    })

    expect(screen.getByText('No addresses found')).toBeInTheDocument()
  })

  test('shows loading indicator when fetching balances', () => {
    renderWithProviders({
      coinType: 'Mintlayer',
      mintlayer: { fetchingBalances: true, addressData: [] },
    })

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByTestId('address-table')).not.toBeInTheDocument()
  })
})
