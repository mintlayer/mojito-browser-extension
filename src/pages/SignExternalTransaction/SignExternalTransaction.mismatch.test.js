import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent } from '@testing-library/react'

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
      accountID: 'mismatch-test-account',
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

const transferRequest = (outputAmount) => ({
  request: {
    origin: 'https://attacker.example',
    requestId: 'mismatch-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: {
        JSONRepresentation: {
          inputs: [
            {
              input: {
                index: 0,
                input_type: 'UTXO',
                source_id:
                  '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                source_type: 'Transaction',
              },
              utxo: {
                destination: 'tmt1qwalletreceiving',
                value: {
                  type: 'Coin',
                  amount: {
                    atoms: '1707148604300000',
                    decimal: '17071.486043',
                  },
                },
              },
            },
          ],
          outputs: [
            {
              destination: 'tmt1qattackerdestination',
              type: 'Transfer',
              value: { type: 'Coin', amount: outputAmount },
            },
          ],
        },
      },
    },
  },
})

// THE ATTACK: the dApp reports "1 ML" while committing the whole balance.
const mismatchingRequest = transferRequest({
  decimal: '1',
  atoms: '1707148604300000',
})
const honestRequest = transferRequest({
  decimal: '10',
  atoms: '1000000000000',
})

// HTLC-shaped input WITHOUT the htlc object — previously crashed the render
// at `HtlcInput.utxo.htlc.spend_key` (approval unreachable from the window).
const malformedHtlcRequest = {
  request: {
    origin: 'https://attacker.example',
    requestId: 'htlc-malformed-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: {
        JSONRepresentation: {
          inputs: [
            {
              input: {
                index: 0,
                input_type: 'UTXO',
                source_id:
                  '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                source_type: 'Transaction',
              },
              utxo: {
                type: 'Htlc',
                destination: 'tmt1qwalletreceiving',
                value: {
                  type: 'Coin',
                  amount: { atoms: '1000000000000', decimal: '10' },
                },
              },
            },
          ],
          outputs: [
            {
              destination: 'tmt1qattackerdestination',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '900000000000', decimal: '9' },
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

describe('SignTransactionPage — decimal vs signed-atoms reconciliation', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('blocks approval when the site-reported decimal disagrees with the signed atoms', () => {
    renderSignPage(mismatchingRequest)

    // the page-level error and the summary banner both fail closed
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()

    const approve = screen.getByText('Approve and return to page')
    expect(approve).toBeDisabled()
  })

  it('keeps approval available for a consistent payload', () => {
    renderSignPage(honestRequest)

    expect(
      screen.queryByText(/Amount verification failed/),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()

    expect(screen.getByText('Approve and return to page')).toBeEnabled()
  })

  // SECURITY REGRESSION: a payload with an HTLC-shaped input but no htlc
  // object used to crash isHTLCClaim during render, wedging the approval
  // window behind the ErrorBoundary. It must render fail-closed instead.
  it('renders without crashing on an HTLC input without an htlc object', () => {
    renderSignPage(malformedHtlcRequest)

    // the page rendered (no ErrorBoundary wedge) and, the amounts being
    // consistent, approval stays reachable
    const approve = screen.getByText('Approve and return to page')
    expect(approve).toBeInTheDocument()
    expect(approve).toBeEnabled()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Amount verification failed/),
    ).not.toBeInTheDocument()
  })

  // SECURITY REGRESSION: with a destination-less output (e.g. DataDeposit),
  // `output?.destination === spend_key` compared undefined === undefined and
  // spuriously entered HTLC claim mode. Claim mode must require an actual
  // spend_key.
  it('does not enter claim mode on undefined spend_key vs undefined destination', () => {
    const request = JSON.parse(JSON.stringify(malformedHtlcRequest))
    request.request.data.txData.JSONRepresentation.outputs = [
      { type: 'DataDeposit', data: 'deadbeef' },
    ]

    renderSignPage(request)

    // open the approval modal (password path — no passkey in this wallet)
    fireEvent.click(screen.getByText('Approve and return to page'))
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()

    // claim mode was NOT entered: no HTLC secret field in the modal
    expect(screen.queryByText(/htlc secret/i)).not.toBeInTheDocument()
  })

  // SECURITY REGRESSION: the background forwards dApp params unvalidated —
  // non-array legs used to crash the render into the ErrorBoundary wedge.
  it('blocks approval when the payload legs are not arrays', () => {
    const request = JSON.parse(JSON.stringify(honestRequest))
    request.request.data.txData.JSONRepresentation.inputs = {}

    renderSignPage(request)

    // fail closed: no crash, error shown, approve disabled
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeDisabled()
  })
})
