import React from 'react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router'
import { render, screen, act, waitFor } from '@testing-library/react'

import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { BitcoinContext } from '@Contexts'
import { SignBitcoinTransactionPage } from './SignBitcoinTransaction'

// Keep the output readable: swallow React error-logging noise.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

// Minimal chrome stub — must exist before the page's module graph loads
// anything reading chrome.* (see SignExternalTransaction.TDZ.test.js).
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
  }
  return {
    __esModule: true,
    Browser: api,
    runtime: api.runtime,
    storage: api.storage,
    sendPopupResponse: api.sendPopupResponse,
  }
})

// The page imports the wasm package by DIRECTORY, bypassing the jest
// moduleNameMapper — mock the resolved module.
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
    hasPasskey: jest.fn(),
    unlockAccount: jest.fn(),
    unlockHtlsSecret: jest.fn(),
    saveProvidedHtlsSecret: jest.fn(),
    getPasswordWithPasskey: jest.fn(),
    getAccount: jest.fn(),
  },
  AccountHelpers: {},
}))

jest.mock('@APIs', () => ({
  __esModule: true,
  Electrum: {
    getFeesEstimates: jest.fn(() =>
      Promise.reject(new Error('fees unavailable')),
    ),
  },
  Mintlayer: {},
}))

// The gate under test is WHICH request owns the frozen escrow record, not
// the crypto: the HTLC/fee computations are stubbed with controllable
// promises so the async recompute window between two navigations is
// directly observable.
jest.mock('@Cryptos', () => ({
  __esModule: true,
  BTC: {},
  BTC_ADDRESS_TYPE_ENUM: {
    LEGACY: 'legacy',
    P2SH: 'p2sh',
    NATIVE_SEGWIT: 'nativeSegwit',
  },
  BTCTransaction: {
    buildHTLCAndFundingAddress: jest.fn(),
    calculateBtcTransactionFee: jest.fn(),
    buildTransaction: jest.fn(),
  },
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'escrow-reset-account',
      addresses: {},
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({
      btcUtxos: [],
      unusedAddresses: { changeAddress: 'tb1qchangeaddress' },
    }),
    MintlayerContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

const makeRequestState = (requestId, amountAtoms, timeoutBlocks) => ({
  request: {
    requestId,
    origin: 'https://dapp.example',
    network: 'testnet',
    data: {
      txData: {
        JSONRepresentation: {
          secretHash: '{"secret_hash_hex":"ab"}',
          amount: amountAtoms,
          timeoutBlocks,
        },
      },
    },
  },
})

let navigateTo
const NavigationProbe = () => {
  const navigate = useNavigate()
  navigateTo = navigate
  return null
}

// btcUtxos is provider-injected so a test can flip it to a NEW array
// identity, forcing the page's wallet-data effect to genuinely re-execute
// (same request, refreshed UTXO set — the 2-minute poll scenario).
const SignPageHarness = ({ initialState, btcUtxos }) => (
  <MemoryRouter
    initialEntries={[{ pathname: '/sign-btc', state: initialState }]}
  >
    <NavigationProbe />
    <Routes>
      <Route
        path="/sign-btc"
        element={
          <BitcoinContext.Provider
            value={{
              btcUtxos,
              unusedAddresses: { changeAddress: 'tb1qchangeaddress' },
            }}
          >
            <SignBitcoinTransactionPage />
          </BitcoinContext.Provider>
        }
      />
    </Routes>
  </MemoryRouter>
)

const renderSignPage = (initialState, btcUtxos = []) =>
  render(
    <SignPageHarness
      initialState={initialState}
      btcUtxos={btcUtxos}
    />,
  )

// The 'Escrow address' row renders as <dt>label</dt><dd>value</dd>.
const escrowAddressValue = () => {
  const label = screen.getByText('Escrow address')
  return label.parentElement.querySelector('dd')?.textContent
}

describe('SignBitcoinTransaction escrow record ownership', () => {
  let htlcDeferreds

  beforeEach(() => {
    jest.clearAllMocks()
    errorSpy.mockClear()
    htlcDeferreds = []
    BTCTransaction.buildHTLCAndFundingAddress.mockImplementation(
      () =>
        new Promise((resolve) => {
          htlcDeferreds.push(resolve)
        }),
    )
    BTCTransaction.calculateBtcTransactionFee.mockResolvedValue(1540)
    Account.getAccount.mockResolvedValue({ walletType: 'nativeSegwit' })
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  test('a new request navigated into the mounted route cannot inherit the previous request\u2019s escrow record', async () => {
    const stateA = makeRequestState('req-a', '20000', 500)
    const stateB = makeRequestState('req-b', '30000', 600)

    renderSignPage(stateA)

    // Request A's recompute is pending: no escrow facts shown yet.
    expect(escrowAddressValue()).toBe('unavailable')

    await act(async () => {
      htlcDeferreds[0]({
        p2wshAddress: 'tb1qescrowA',
        redeemScriptHex: 'ab',
      })
    })
    await waitFor(() => expect(escrowAddressValue()).toBe('tb1qescrowA'))

    // Navigate request B into the SAME mounted route (same path, no remount).
    act(() => {
      navigateTo('/sign-btc', { state: stateB })
    })

    // Regression: during B's async recompute window the recap must not show
    // request A's escrow address (previously it stayed visible).
    expect(escrowAddressValue()).toBe('unavailable')
    expect(screen.queryByText('tb1qescrowA')).not.toBeInTheDocument()

    await act(async () => {
      htlcDeferreds[1]({
        p2wshAddress: 'tb1qescrowB',
        redeemScriptHex: 'cd',
      })
    })
    await waitFor(() => expect(escrowAddressValue()).toBe('tb1qescrowB'))
    expect(screen.queryByText('tb1qescrowA')).not.toBeInTheDocument()
  })

  test('keeps the current record visible across same-request recomputes (UTXO poll rerun)', async () => {
    const stateA = makeRequestState('req-a', '20000', 500)
    const initialUtxos = []
    // NEW array identity (like a poll-refreshed wallet data set): flipping
    // this must re-execute the effect for the SAME request.
    const refreshedUtxos = [
      {
        txid: 'cc'.repeat(32),
        vout: 0,
        value: 120000,
        address: 'tb1qnewutxo',
      },
    ]

    const view = renderSignPage(stateA, initialUtxos)

    await act(async () => {
      htlcDeferreds[0]({
        p2wshAddress: 'tb1qescrowA',
        redeemScriptHex: 'ab',
      })
    })
    await waitFor(() => expect(escrowAddressValue()).toBe('tb1qescrowA'))

    // Wallet data refresh: the new btcUtxos identity reruns the effect
    // while requestJSON (and therefore record ownership) stays unchanged.
    view.rerender(
      <SignPageHarness
        initialState={stateA}
        btcUtxos={refreshedUtxos}
      />,
    )

    // The rerun genuinely happened: a second HTLC computation is pending.
    expect(htlcDeferreds.length).toBe(2)

    // During the pending recompute the recap keeps the current record —
    // routine wallet-data refreshes must not flicker the escrow row to
    // 'unavailable'.
    expect(escrowAddressValue()).toBe('tb1qescrowA')
    expect(screen.queryByText('unavailable')).not.toBeInTheDocument()

    // The refreshed record (same owner) replaces the old one, built from
    // the refreshed UTXO snapshot.
    await act(async () => {
      htlcDeferreds[1]({
        p2wshAddress: 'tb1qescrowA2',
        redeemScriptHex: 'ab',
      })
    })
    await waitFor(() => expect(escrowAddressValue()).toBe('tb1qescrowA2'))
    expect(BTCTransaction.calculateBtcTransactionFee).toHaveBeenLastCalledWith(
      expect.objectContaining({ utxos: refreshedUtxos }),
    )
  })
})
