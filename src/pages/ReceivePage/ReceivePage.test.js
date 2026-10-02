import React from 'react'
import { MemoryRouter } from 'react-router'
import { render, screen, fireEvent } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      addresses: {
        btcAddresses: {
          btcReceivingAddresses: [{ bc1qnew: { pubkey: { 1: 2 } } }],
          btcChangeAddresses: [],
        },
        mlAddresses: {
          mlReceivingAddresses: ['mtc1qnew'],
          mlChangeAddresses: [],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
  }
})

const renderAt = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/receive', state }]}>
      <ReceivePage />
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const ReceivePage = require('./ReceivePage').default

describe('ReceivePage', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('renders the BTC address string from new-store object entries without crashing', () => {
    const { container } = renderAt({ chain: 'Bitcoin' })

    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    expect(screen.getByText(/bc1qnew/)).toBeInTheDocument()
    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
    expect(
      container.querySelector('[data-testid="qr-code"] svg'),
    ).toBeInTheDocument()
    expect(container).not.toBeEmptyDOMElement()
  })

  it('renders the ML address string and QR when the Mintlayer tab is selected', () => {
    renderAt({ chain: 'Bitcoin' })

    fireEvent.click(screen.getByRole('button', { name: 'Mintlayer' }))

    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    expect(screen.getByText('mtc1qnew')).toBeInTheDocument()
    expect(screen.getByTestId('qr-code')).toBeInTheDocument()
  })

  it('pre-selects the chain passed via navigation state', () => {
    renderAt({ chain: 'Bitcoin' })

    expect(screen.getByText(/bc1qnew/)).toBeInTheDocument()
  })

  it('defaults to Mintlayer when no chain is passed (generic entry)', () => {
    renderAt(undefined)

    expect(screen.getByText('mtc1qnew')).toBeInTheDocument()
  })

  it('shows the placeholder and fallback text when no address data exists', () => {
    const { AccountContext } = require('@Contexts')
    render(
      <MemoryRouter initialEntries={[{ pathname: '/receive' }]}>
        <AccountContext.Provider value={{ addresses: {} }}>
          <ReceivePage />
        </AccountContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.queryByTestId('qr-code')).not.toBeInTheDocument()
    expect(
      screen.getByText('Address unavailable — unlock your wallet'),
    ).toBeInTheDocument()
  })
})
