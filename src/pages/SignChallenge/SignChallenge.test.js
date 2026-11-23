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

// The sign-through cases stop at the signer boundary: the key derivation
// and the wasm signature are stubbed, so the response payload is the
// assertion surface.
jest.mock('../../services/Crypto/Mintlayer/Mintlayer', () => ({
  ...jest.requireActual('../../services/Crypto/Mintlayer/Mintlayer'),
  getWalletPrivKeysList: jest.fn(() => ({
    mlReceivingPrivKeys: { tmt1qwalletreceiving: 'receiving-priv' },
    mlChangePrivKeys: { tmt1qwalletchange: 'change-priv' },
  })),
}))

jest.mock('../../utils/Helpers/ML/SignTransaction', () => ({
  ...jest.requireActual('../../utils/Helpers/ML/SignTransaction'),
  signChallenge: jest.fn(() => [1, 2, 3]),
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

// Mounts the page inside the shipped ErrorBoundary, like the panel and
// popup do, so a render crash shows up as the "Something went wrong"
// fallback instead of going unnoticed by the assertions.
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
      <ErrorBoundary>
        <Routes>
          <Route
            path="/wallet/:coinType/sign-challenge"
            element={<SignChallengePage />}
          />
        </Routes>
      </ErrorBoundary>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const { SignChallengePage } = require('./SignChallenge')
// eslint-disable-next-line import/first
const { ErrorBoundary } = require('@BasicComponents')
// eslint-disable-next-line import/first
const { SignTransaction } = require('@Helpers')

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

// The background forwards dApp params unvalidated, so `message` and
// `address` are dApp-supplied. Only a string can be shown as text (an
// object thrown during render and replaced the wallet surface with the
// error fallback, Decline unreachable), and only a string message can be
// encoded by the signer. Any other type is read as absent.
describe('SignChallengePage — dApp-supplied message and address', () => {
  const withData = (data) => ({
    request: { ...challengeRequest('testnet').request, data },
  })
  const signButton = () => screen.getByText('Sign and return to page')

  const expectDeclineAnswers = () => {
    fireEvent.click(screen.getByText('Decline'))
    expect(sendPopupResponse).toHaveBeenCalledWith({
      method: 'signChallenge_reject',
      requestId: 'stale-1',
      origin: 'https://bridge.example',
      error: 'Challenge signing rejected',
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    AccountModule.unlockAccount.mockResolvedValue({
      mlPrivKeys: { mlTestnetPrivateKey: 'test-priv' },
    })
  })

  it.each([
    ['an object', {}],
    ['an object shadowing toString', { toString: 1 }],
    ['a number', 42],
    ['an array of strings', ['ab', 'c']],
    ['an array with an object', [{}]],
    ['null', null],
  ])(
    'shows the placeholder, keeps Decline and disables Sign for a message that is %s',
    (_shape, message) => {
      renderSignPage(withData({ message, address: 'tmt1qwalletreceiving' }))

      // the page rendered (no error fallback) with the placeholder, and
      // nothing of a non-string message is concatenated into the text
      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
      expect(screen.getByText('No message provided')).toBeInTheDocument()
      expect(screen.queryByText('abc')).not.toBeInTheDocument()
      expect(screen.queryByText('42')).not.toBeInTheDocument()
      expect(screen.getByText('tmt1qwalletreceiving')).toBeInTheDocument()

      // nothing that cannot be encoded may reach Sign: the page says why
      expect(signButton()).toBeDisabled()
      expect(screen.getByText(/nothing that can be signed/)).toBeInTheDocument()

      expectDeclineAnswers()
      expect(AccountModule.unlockAccount).not.toHaveBeenCalled()
    },
  )

  // An array of strings rendered as its elements joined with no separator:
  // ['ab','c'] and ['a','bc'] looked identical above the Sign button.
  it('does not concatenate an array message into a single text', () => {
    renderSignPage(
      withData({ message: ['ab', 'c'], address: 'tmt1qwalletreceiving' }),
    )

    expect(screen.queryByText('abc')).not.toBeInTheDocument()
    expect(screen.queryByText('ab')).not.toBeInTheDocument()
    expect(screen.getByText('No message provided')).toBeInTheDocument()
    expect(signButton()).toBeDisabled()
  })

  it.each([
    ['an object', {}],
    ['an object shadowing toString', { toString: 1 }],
    ['a number', 42],
    ['null', null],
  ])(
    'reads an address that is %s as absent and signs with the wallet default',
    async (_shape, address) => {
      renderSignPage(
        withData({ message: 'Please sign this challenge.', address }),
      )

      expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
      expect(
        screen.getByText('Please sign this challenge.'),
      ).toBeInTheDocument()
      expect(screen.getByText('No address provided')).toBeInTheDocument()
      expect(
        screen.queryByText(/nothing that can be signed/),
      ).not.toBeInTheDocument()
      expect(signButton()).toBeEnabled()

      await approveThroughPasswordModal()

      expect(SignTransaction.signChallenge).toHaveBeenCalledWith(
        'Please sign this challenge.',
        'tmt1qwalletreceiving',
        expect.any(Object),
      )
      expect(sendPopupResponse).toHaveBeenCalledWith({
        method: 'signChallenge_approve',
        requestId: 'stale-1',
        origin: 'https://bridge.example',
        result: {
          message: 'Please sign this challenge.',
          address: 'tmt1qwalletreceiving',
          signature: '010203',
        },
      })
    },
  )

  it('signs a string message with the requested string address (unchanged)', async () => {
    renderSignPage(
      withData({
        message: 'Please sign this challenge.',
        address: 'tmt1qwalletchange',
      }),
    )

    expect(screen.getByText('Please sign this challenge.')).toBeInTheDocument()
    expect(screen.getByText('tmt1qwalletchange')).toBeInTheDocument()
    expect(
      screen.queryByText(/nothing that can be signed/),
    ).not.toBeInTheDocument()
    expect(signButton()).toBeEnabled()

    await approveThroughPasswordModal()

    expect(sendPopupResponse).toHaveBeenCalledWith({
      method: 'signChallenge_approve',
      requestId: 'stale-1',
      origin: 'https://bridge.example',
      result: {
        message: 'Please sign this challenge.',
        address: 'tmt1qwalletchange',
        signature: '010203',
      },
    })
  })
})

// The site badge renders the origin as text: only a string is shown, any
// other type reads as an unknown site (and is never echoed to the bridge).
describe('SignChallengePage — origin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    ['an object', {}],
    ['an object shadowing toString', { toString: 1 }],
    ['an array with an object', [{}]],
    ['a number', 42],
  ])('shows the unknown-site badge when the origin is %s', (_shape, origin) => {
    const state = challengeRequest('testnet')
    state.request.origin = origin

    renderSignPage(state)

    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument()
    expect(screen.getByText('Unknown Website')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Decline'))
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'signChallenge_reject' }),
    )
    expect(sendPopupResponse.mock.calls[0][0].origin).toBeUndefined()
  })
})
