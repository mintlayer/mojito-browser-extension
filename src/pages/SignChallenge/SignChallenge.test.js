import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { sendPopupResponse } from '@Browser'
import { Account as AccountModule } from '@Entities'

// Keep the output readable: swallow React's error logging noise.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

// Minimal chrome stub — see SignExternalTransaction.TDZ.test.js for why this
// must exist before the page's module graph loads anything reading chrome.*.
jest.mock('@Browser', () => {
  /* eslint-disable-next-line no-undef */
  global.chrome = {
    runtime: { sendMessage: jest.fn(), lastError: null },
    storage: {
      local: {
        get: jest.fn((_keys, cb) => cb && cb({})),
        set: jest.fn((_items, cb) => cb && cb()),
        remove: jest.fn((_keys, cb) => cb && cb()),
      },
      onChanged: { addListener: jest.fn(), removeListener: jest.fn() },
    },
    windows: { getCurrent: jest.fn((cb) => cb({ id: 1 })) },
  }
  const api = {
    runtime: global.chrome.runtime,
    storage: global.chrome.storage,
    windows: global.chrome.windows,
    sendPopupResponse: jest.fn(),
    notifyApprovalDisplayed: jest.fn(),
  }
  return {
    __esModule: true,
    Browser: api,
    runtime: api.runtime,
    storage: api.storage,
    sendPopupResponse: api.sendPopupResponse,
    notifyApprovalDisplayed: api.notifyApprovalDisplayed,
  }
})

// The page imports the wasm package by DIRECTORY, bypassing the jest
// moduleNameMapper for `.*wasm_wrappers.js` — mock the resolved module.
jest.mock('../../services/Crypto/Mintlayer/@mintlayerlib-js', () => ({
  __esModule: true,
  Network: Object.freeze({
    Mainnet: 0,
    0: 'Mainnet',
    Testnet: 1,
    1: 'Testnet',
  }),
}))

jest.mock('@Entities', () => ({
  __esModule: true,
  Account: {
    hasPasskey: jest.fn().mockResolvedValue(false),
    unlockAccount: jest.fn(),
    unlockHtlsSecret: jest.fn(),
    saveProvidedHtlsSecret: jest.fn(),
    getPasswordWithPasskey: jest.fn(),
  },
}))

// Plausible providers — real page, real child components, fake wallet state.
jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'challenge-guard-test-account',
      addresses: {
        btcAddresses: { btcReceivingAddresses: [], btcChangeAddresses: [] },
        mlAddresses: {
          mlReceivingAddresses: ['tmt1qwalletreceiving'],
          mlChangeAddresses: ['tmt1qwalletchange'],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({}),
    MintlayerContext: makeCtx({
      currentHeight: 100,
      setAllDataFetching: jest.fn(),
      tokenMap: {},
      allNetworkTokensData: [],
    }),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// Requests shaped like the ones the approval window receives via router
// state. The wallet in this harness is on TESTNET.
const challengeRequest = (network) => ({
  request: {
    origin:
      network === undefined
        ? 'https://legacy.example'
        : 'https://bridge.example',
    requestId: network === undefined ? 'unstamped-1' : 'stale-1',
    // network omitted = pre-upgrade grant shape (never recorded a network)
    ...(network !== undefined ? { network } : {}),
    data: {
      message: 'Please sign this challenge.',
      address: 'tmt1qwalletreceiving',
    },
  },
})

const renderSignPage = (state) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/wallet/Mintlayer/sign-challenge',
          state,
        },
      ]}
    >
      <Routes>
        <Route
          path="/wallet/:coinType/sign-challenge"
          element={<SignChallengePage />}
        />
      </Routes>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const { SignChallengePage } = require('./SignChallenge')

// Pins the sign-page fail-closed network guard that doc/bridge-contract.md
// promises: a request whose grant has NO recorded network (pre-upgrade
// grant) or a DIFFERENT network than the wallet's active one must reject
// with WRONG_NETWORK before any key material is touched.
describe('SignChallengePage — fail-closed network guard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  const approveThroughPasswordModal = async () => {
    // open the approval modal (password path) and submit
    fireEvent.click(screen.getByText('Sign and return to page'))
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    fireEvent.click(screen.getByText('Approve'))
    await waitFor(() => expect(sendPopupResponse).toHaveBeenCalled())
  }

  // SECURITY REGRESSION (pre-upgrade grants): a request without a recorded
  // network cannot be proven current — the guard must reject it instead of
  // signing.
  it('rejects with WRONG_NETWORK when the request has no recorded network', async () => {
    renderSignPage(challengeRequest(undefined))

    await approveThroughPasswordModal()

    expect(sendPopupResponse).toHaveBeenCalledWith({
      method: 'signChallenge_reject',
      requestId: 'unstamped-1',
      origin: 'https://legacy.example',
      error: {
        code: 'WRONG_NETWORK',
        message: expect.stringContaining(
          'connected before the wallet recorded its network',
        ),
      },
    })
    // the guard fires BEFORE the signing path: no key material unlocked
    expect(AccountModule.unlockAccount).not.toHaveBeenCalled()
  })

  it('rejects with WRONG_NETWORK when the request was granted on another network', async () => {
    renderSignPage(challengeRequest('mainnet')) // wallet is on testnet

    await approveThroughPasswordModal()

    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signChallenge_reject',
        requestId: 'stale-1',
        origin: 'https://bridge.example',
        error: expect.objectContaining({
          code: 'WRONG_NETWORK',
          message: expect.stringContaining("connected on 'mainnet'"),
        }),
      }),
    )
    expect(AccountModule.unlockAccount).not.toHaveBeenCalled()
  })
})
