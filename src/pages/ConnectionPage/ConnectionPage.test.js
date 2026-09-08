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

const renderAt = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/connect', state }]}>
      <Routes>
        <Route
          path="/connect"
          element={<ConnectionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

const renderWithAddresses = (addresses, state = { request }) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/connect', state }]}>
      <AccountContext.Provider value={{ addresses }}>
        <Routes>
          <Route
            path="/connect"
            element={<ConnectionPage />}
          />
        </Routes>
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
    expect(payload.result.addressesByChain.mintlayer.publicKeys.change).toEqual(
      [],
    )

    // Old store kept plain strings for BTC addresses; addresses are passed,
    // public keys are simply omitted (empty) instead of crashing.
    expect(payload.result.addressesByChain.bitcoin.receiving).toEqual([
      'bc1qold',
    ])
    expect(payload.result.addressesByChain.bitcoin.change).toEqual([])
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys.receiving,
    ).toEqual([])
    expect(payload.result.addressesByChain.bitcoin.publicKeys.change).toEqual(
      [],
    )
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
    expect(payload.result.addressesByChain.mintlayer.publicKeys.change).toEqual(
      ['06'],
    )
    expect(payload.result.addressesByChain.bitcoin.receiving).toEqual([
      'bc1qnew',
    ])
    expect(payload.result.addressesByChain.bitcoin.change).toEqual(['bc1qnewc'])
    expect(
      payload.result.addressesByChain.bitcoin.publicKeys.receiving,
    ).toEqual(['02'])
    expect(payload.result.addressesByChain.bitcoin.publicKeys.change).toEqual([
      '04',
    ])
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
})
