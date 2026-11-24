import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

jest.mock('@Browser', () => ({
  __esModule: true,
  sendPopupResponse: jest.fn(),
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      addresses: {
        btcAddresses: {
          btcReceivingAddresses: ['bc1qold'],
          btcChangeAddresses: [],
        },
        mlAddresses: {
          mlReceivingAddresses: ['mtc1qold'],
          mlChangeAddresses: [],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
    BitcoinContext: makeCtx({}),
    MintlayerContext: makeCtx({}),
  }
})

const request = {
  origin: 'https://bridge.example',
  requestId: 'r1',
  permissions: ['bitcoin'],
}

// Both helpers mount the page inside the shipped ErrorBoundary, like the
// panel and popup do, so a render crash shows up as the "Something went
// wrong" fallback instead of going unnoticed by the assertions.
const renderAt = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/connect', state }]}>
      <ErrorBoundary>
        <Routes>
          <Route
            path="/connect"
            element={<ConnectionPage />}
          />
        </Routes>
      </ErrorBoundary>
    </MemoryRouter>,
  )

const renderWithAddresses = (addresses, state = { request }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/connect', state }]}>
      <AccountContext.Provider value={{ addresses }}>
        <ErrorBoundary>
          <Routes>
            <Route
              path="/connect"
              element={<ConnectionPage />}
            />
          </Routes>
        </ErrorBoundary>
      </AccountContext.Provider>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const ConnectionPage = require('./ConnectionPage').default
// eslint-disable-next-line import/first
const { AccountContext } = require('@Contexts')
// eslint-disable-next-line import/first
const { sendPopupResponse } = require('@Browser')
// eslint-disable-next-line import/first
const { ErrorBoundary } = require('@BasicComponents')

describe('ConnectionPage', () => {
  beforeEach(() => {
    sendPopupResponse.mockClear()
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('connects with an old-store addresses blob (no public keys) without crashing', () => {
    renderAt({ request })

    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('connect-button'))

    expect(sendPopupResponse).toHaveBeenCalledTimes(1)
    const payload = sendPopupResponse.mock.calls[0][0]
    expect(payload.method).toBe('connect')
    expect(payload.requestId).toBe('r1')
    expect(payload.origin).toBe('https://bridge.example')

    expect(payload.result.addressesByChain.mintlayer.receiving).toEqual([
      'mtc1qold',
    ])
    expect(
      payload.result.addressesByChain.mintlayer.publicKeys.receiving,
    ).toEqual([])
    // SECURITY: change addresses/pubkeys are no longer part of a grant.
    expect(
      payload.result.addressesByChain.mintlayer.publicKeys,
    ).not.toHaveProperty('change')

    // Old store kept plain strings for BTC addresses; addresses are passed,
    // public keys are simply omitted (empty) instead of crashing.
    expect(payload.result.addressesByChain.bitcoin.receiving).toEqual([
      'bc1qold',
    ])
    expect(payload.result.addressesByChain.bitcoin).not.toHaveProperty('change')
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys.receiving,
    ).toEqual([])
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys,
    ).not.toHaveProperty('change')
  })

  it('connects with the new-store shape (object BTC entries and public keys)', () => {
    const addresses = {
      mlAddresses: {
        mlReceivingAddresses: ['mtc1qnew'],
        mlChangeAddresses: ['mtc1qnewc'],
        mlReceivingPublicKeys: [{ 1: 2 }, { 3: 4 }],
        mlChangePublicKeys: [{ 5: 6 }],
      },
      btcAddresses: {
        btcReceivingAddresses: [{ bc1qnew: { pubkey: { 1: 2 } } }],
        btcChangeAddresses: [{ bc1qnewc: { pubkey: { 3: 4 } } }],
      },
    }

    renderWithAddresses(addresses)

    fireEvent.click(screen.getByTestId('connect-button'))

    expect(sendPopupResponse).toHaveBeenCalledTimes(1)
    const payload = sendPopupResponse.mock.calls[0][0]
    expect(
      payload.result.addressesByChain.mintlayer.publicKeys.receiving,
    ).toEqual(['02', '04'])
    // SECURITY: change addresses/pubkeys are no longer part of a grant.
    expect(
      payload.result.addressesByChain.mintlayer.publicKeys,
    ).not.toHaveProperty('change')
    expect(payload.result.addressesByChain.bitcoin.receiving).toEqual([
      'bc1qnew',
    ])
    expect(payload.result.addressesByChain.bitcoin).not.toHaveProperty('change')
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys.receiving,
    ).toEqual(['02'])
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys,
    ).not.toHaveProperty('change')
  })

  it('omits the bitcoin block when the site never asked for the bitcoin permission', () => {
    const addresses = {
      mlAddresses: {
        mlReceivingAddresses: ['mtc1qnew'],
        mlChangeAddresses: ['mtc1qnewc'],
        mlReceivingPublicKeys: [{ 1: 2 }],
        mlChangePublicKeys: [{ 5: 6 }],
      },
      btcAddresses: {
        btcReceivingAddresses: [{ bc1qnew: { pubkey: { 1: 2 } } }],
        btcChangeAddresses: [{ bc1qnewc: { pubkey: { 3: 4 } } }],
      },
    }

    // no 'bitcoin' entry in the requested permissions
    renderWithAddresses(addresses, {
      request: {
        origin: 'https://bridge.example',
        requestId: 'r1',
        permissions: [],
      },
    })

    fireEvent.click(screen.getByTestId('connect-button'))

    const payload = sendPopupResponse.mock.calls[0][0]
    // the wallet must not silently hand out bitcoin addresses/keys
    expect(payload.result.addressesByChain.bitcoin).toBeUndefined()
    expect(payload.result.address.mainnet.receiving).toEqual(['mtc1qnew'])
  })

  it('omits the bitcoin block when no BTC address data exists', () => {
    const addresses = {
      mlAddresses: { mlReceivingAddresses: ['mtc1qonlyml'] },
    }

    renderWithAddresses(addresses)

    fireEvent.click(screen.getByTestId('connect-button'))

    expect(sendPopupResponse).toHaveBeenCalledTimes(1)
    const payload = sendPopupResponse.mock.calls[0][0]
    expect(payload.result.addressesByChain.bitcoin).toBeUndefined()
  })

  it('rejects with a null result', () => {
    renderAt({ request })

    fireEvent.click(screen.getByTestId('reject-button'))

    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'connect',
        requestId: 'r1',
        origin: 'https://bridge.example',
        result: null,
      }),
    )
  })

  it('warns, disables Connect and does not respond when wallet data is incomplete', () => {
    renderWithAddresses(null)

    expect(screen.getByTestId('incomplete-data-warning')).toBeInTheDocument()
    expect(screen.getByTestId('connect-button')).toBeDisabled()

    fireEvent.click(screen.getByTestId('connect-button'))
    expect(sendPopupResponse).not.toHaveBeenCalled()

    // Reject stays available so the dApp always gets an answer.
    fireEvent.click(screen.getByTestId('reject-button'))
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({ result: null }),
    )
  })

  // `permissions` is dApp-supplied: a value that is not an array is read
  // as "no permissions asked", so the approval still renders and stays
  // answerable instead of crashing into the error fallback.
  it.each([
    ['a number', 42],
    ['an object', {}],
    ['a string', 'bitcoin'],
  ])(
    'renders an answerable approval when permissions is %s',
    (_shape, permissions) => {
      const addresses = {
        mlAddresses: { mlReceivingAddresses: ['mtc1qnew'] },
      }

      renderWithAddresses(addresses, {
        request: { ...request, permissions },
      })

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
      expect(screen.getByTestId('reject-button')).toBeInTheDocument()
      expect(screen.getByTestId('connect-button')).toBeInTheDocument()
      // no 'bitcoin' entry was asked for: no Bitcoin data toggle
      expect(screen.queryByRole('switch')).not.toBeInTheDocument()
      expect(screen.queryByText('Provide Bitcoin data')).not.toBeInTheDocument()

      fireEvent.click(screen.getByTestId('reject-button'))
      expect(sendPopupResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'connect',
          requestId: 'r1',
          result: null,
        }),
      )
    },
  )

  // The 'bitcoin' permission only OFFERS the toggle: the user's own choice
  // on it is what decides whether Bitcoin addresses and keys are shared.
  describe('Bitcoin data toggle', () => {
    const addresses = {
      mlAddresses: { mlReceivingAddresses: ['mtc1qnew'] },
      btcAddresses: {
        btcReceivingAddresses: ['bc1qnew'],
        btcChangeAddresses: [],
      },
    }

    const connectResult = () => sendPopupResponse.mock.calls[0][0].result

    it('shows the toggle and shares Bitcoin data while it is left on', () => {
      renderWithAddresses(addresses)

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
      expect(screen.getByText('Provide Bitcoin data')).toBeInTheDocument()
      expect(screen.getByRole('switch')).toBeChecked()

      fireEvent.click(screen.getByTestId('connect-button'))

      expect(sendPopupResponse).toHaveBeenCalledTimes(1)
      const { addressesByChain } = connectResult()
      expect(addressesByChain).toHaveProperty('bitcoin')
      expect(addressesByChain.bitcoin.receiving).toEqual(['bc1qnew'])
    })

    it('shares no Bitcoin data once the user switches it off', () => {
      renderWithAddresses(addresses)

      fireEvent.click(screen.getByRole('switch'))
      expect(screen.getByRole('switch')).not.toBeChecked()

      fireEvent.click(screen.getByTestId('connect-button'))

      expect(sendPopupResponse).toHaveBeenCalledTimes(1)
      const { addressesByChain } = connectResult()
      expect(addressesByChain).not.toHaveProperty('bitcoin')
      // the Mintlayer data does not depend on the toggle
      expect(addressesByChain.mintlayer.receiving).toEqual(['mtc1qnew'])
    })
  })
})
