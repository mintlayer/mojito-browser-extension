import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import AddressListItem from './AddressListItem'
import { SettingsContext } from '@Contexts'
import { ML, BTC } from '@Helpers'

// Suppress only the specific React Router future flag warning
const realWarn = console.warn
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('v7_startTransition')) {
      return
    }
    realWarn(...args)
  })
})

afterAll(() => {
  console.warn.mockRestore()
})

// Unified future flags
const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

// Helper to render with router + context
const renderWithProviders = ({
  ui,
  coinType = 'Mintlayer',
  networkType = 'testnet',
}) => {
  const routes = [
    {
      path: '/:coinType',
      element: (
        <SettingsContext.Provider value={{ networkType }}>
          <table>
            <tbody>{ui}</tbody>
          </table>
        </SettingsContext.Provider>
      ),
    },
  ]

  const router = createMemoryRouter(routes, {
    initialEntries: [`/${coinType}`],
    future: memoryRouterFeature,
  })

  return render(<RouterProvider router={router} />)
}

describe('AddressListItem', () => {
  const baseAddress = {
    id: 'ADDR1',
    used: false,
    coin_balance: { available: '1.23', locked: 0 },
    tokens: [],
  }

  it('renders Mintlayer link and formatted text', () => {
    const networkType = 'testnet'
    const expectedHref = ML.getMlAddressLink('ADDR1', networkType)
    const expectedText = ML.formatAddress('ADDR1', 18)

    renderWithProviders({
      ui: (
        <AddressListItem
          address={baseAddress}
          index={0}
        />
      ),
      coinType: 'Mintlayer',
      networkType,
    })

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', expectedHref)
    expect(link).toHaveTextContent(expectedText)
    expect(screen.getByText(/1\.23 ML/)).toBeInTheDocument()
  })

  it('renders BTC link and formatted text', () => {
    const networkType = 'testnet'
    const expectedHref = BTC.getBtcAddressLink('ADDR1', networkType)
    const expectedText = ML.formatAddress('ADDR1', 18)

    renderWithProviders({
      ui: (
        <AddressListItem
          address={baseAddress}
          index={1}
        />
      ),
      coinType: 'Bitcoin',
      networkType,
    })

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', expectedHref)
    expect(link).toHaveTextContent(expectedText)
    expect(screen.getByText(/1\.23 BTC/)).toBeInTheDocument()
  })

  it('expands and shows tokens when toggled', () => {
    const addressWithTokens = {
      ...baseAddress,
      coin_balance: { available: '5.00', locked: 2 },
      tokens: [
        { amount: { decimal: '10.5' }, token_id: 'TOKEN1' },
        { amount: { decimal: '3.14' }, token_id: 'TOKEN2' },
      ],
    }

    renderWithProviders({
      ui: (
        <AddressListItem
          address={addressWithTokens}
          index={2}
        />
      ),
      coinType: 'Mintlayer',
      networkType: 'testnet',
    })

    const formatted1 = ML.formatAddress('TOKEN1', 12)
    const formatted2 = ML.formatAddress('TOKEN2', 12)

    expect(screen.queryByText(`(${formatted1})`)).not.toBeInTheDocument()

    const toggle = screen.getByRole('button', { name: /2 tokens/i })
    fireEvent.click(toggle)

    expect(screen.getByText(`(${formatted1})`)).toBeInTheDocument()
    expect(screen.getByText(`(${formatted2})`)).toBeInTheDocument()
    expect(screen.getByText(/Locked: 2 ML/)).toBeInTheDocument()
  })
})
