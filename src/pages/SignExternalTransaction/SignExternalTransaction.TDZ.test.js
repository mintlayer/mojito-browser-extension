/**
 * DIAGNOSTIC SPEC — RED by design. DO NOT "fix" by changing this file's
 * expectations; the fix belongs in SignExternalTransaction.js production code.
 *
 * Why this exists
 * ---------------
 * In the packaged (minified) build, opening the approval popup and navigating
 * to /wallet/Mintlayer/sign-external-transaction crashes with:
 *
 *   ReferenceError: Cannot access 'M' before initialization
 *
 * ('M' is the minified name of a binding). The suspicion is a render-phase
 * temporal dead zone (TDZ) in SignTransactionPage: the first useEffect
 * references `accountID` in its DEPENDENCY ARRAY (evaluated synchronously
 * during render), while `accountID` is declared with `const` further down the
 * component body via `const { addresses, accountID } = useContext(AccountContext)`.
 * Because jest's babel config targets node:current, `const` is NOT compiled
 * away, so the real (unminified) identifier appears in the error.
 *
 * What this spec does
 * -------------------
 * 1. Renders the real page with a realistic pending signTransaction request in
 *    route state (the production approval-popup path).
 * 2. Renders the real page with route state = undefined (no pending request).
 * If either render throws, the FULL error.stack is printed via console.error
 * (tagged [TDZ-DIAG] so it survives the console silencing) and then rethrown,
 * keeping the suite RED while making the stack visible.
 *
 * NOTE: no ErrorBoundary is mounted here on purpose — in production the app's
 * ErrorBoundary swallows the render-phase error and shows a fallback; here we
 * want the raw throw so the stack is captured verbatim.
 */

import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render } from '@testing-library/react'

// Keep the output readable: React logs the caught error AND "The above error
// occurred in ..." on every render-phase crash. We swallow that noise but let
// our explicit [TDZ-DIAG] reports through to stderr.
const errorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
  const first = String(args?.[0] ?? '')
  if (first.includes('[TDZ-DIAG]')) {
    process.stderr.write(`\n${args.map(String).join(' ')}\n`)
  }
})

// Minimal chrome stub. jest hoists jest.mock factories above every require in
// this file, so this runs before the page's module graph loads anything that
// might read chrome.* at module scope (src/services/Browser does exactly that).
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
    // The barrel also exports a `Browser` namespace consumed as
    // `const { storage, runtime } = Browser` (SettingsConnections.tsx).
    Browser: api,
    runtime: api.runtime,
    storage: api.storage,
    sendPopupResponse: api.sendPopupResponse,
    notifyApprovalDisplayed: api.notifyApprovalDisplayed,
  }
})

// The page imports the wasm package by DIRECTORY
// (`../../services/Crypto/Mintlayer/@mintlayerlib-js`), which resolves through
// the package's `main` and therefore BYPASSES the jest moduleNameMapper
// (`.*wasm_wrappers.js` only matches requests that literally end in
// wasm_wrappers.js — e.g. @Helpers' imports). The real file uses `import.meta`
// and cannot load under jsdom, so mock the same resolved module here with a
// faithful copy of its Network enum (only used on the signing path, not render).
// Mocks the wasm package by its package-style DIRECTORY path — the exact
// resolved module the page imports. The jest moduleNameMapper
// (`.*wasm_wrappers.js`) only matches requests that literally end in
// wasm_wrappers.js (e.g. @Helpers' imports), so the page's directory import
// bypasses it and would load the real entry (which uses `import.meta` and
// cannot load under jsdom). Registering a factory against the resolved
// directory path intercepts it. Only `Network` is consumed by the page, and
// only on the signing path — the enum copy below is faithful to the real one.
jest.mock('../../services/Crypto/Mintlayer/@mintlayerlib-js', () => ({
  __esModule: true,
  Network: Object.freeze({
    Mainnet: 0,
    0: 'Mainnet',
    Testnet: 1,
    1: 'Testnet',
    Regtest: 2,
    2: 'Regtest',
    Signet: 3,
    3: 'Signet',
  }),
}))

// Plausible providers — real page, real child components, fake wallet state.
jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'tdz-test-account',
      addresses: {
        btcAddresses: {
          btcReceivingAddresses: [],
          btcChangeAddresses: [],
        },
        mlAddresses: {
          mlReceivingAddresses: [],
          mlChangeAddresses: [],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({}),
    MintlayerContext: makeCtx({
      currentHeight: 100,
      setAllDataFetching: jest.fn(),
      tokenMap: {},
    }),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// Minimal pending signTransaction request, matching the shape the background
// puts into location.state and the shape the page/mocks actually consume
// (flat Transfer outputs — see src/pages/SignExternalTransaction/mocks).
const pendingRequest = {
  request: {
    origin: 'https://bridge.mintlayer.org',
    requestId: 'tdz-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: {
        JSONRepresentation: {
          inputs: [],
          outputs: [
            {
              type: 'Transfer',
              destination: 'tmt1qtest',
              value: {
                type: 'Coin',
                amount: { atoms: '1500000', decimal: '1.5' },
              },
            },
          ],
        },
      },
    },
  },
}

const renderSignPage = (state) =>
  render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/wallet/Mintlayer/sign-external-transaction',
          state,
        },
      ]}
    >
      <Routes>
        <Route
          path="/wallet/:coinType/sign-external-transaction"
          element={<SignTransactionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const { SignTransactionPage } = require('./SignExternalTransaction')

describe('SignTransactionPage — TDZ diagnostic (expected RED)', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('renders with a pending signTransaction request in route state', () => {
    try {
      const { container } = renderSignPage(pendingRequest)
      // Reached only if the page renders clean in jsdom — that in itself is a
      // valuable negative result and is reported as such.
      expect(container.innerHTML.length).toBeGreaterThan(0)
    } catch (error) {
      console.error(
        '[TDZ-DIAG] render(path with state) threw. FULL STACK:',
        error?.stack ?? String(error),
      )
      throw error
    }
  })

  it('renders with route state = undefined (no pending request)', () => {
    try {
      const { container } = renderSignPage(undefined)
      expect(container.innerHTML.length).toBeGreaterThan(0)
    } catch (error) {
      console.error(
        '[TDZ-DIAG] render(path with state=undefined) threw. FULL STACK:',
        error?.stack ?? String(error),
      )
      throw error
    }
  })
})
