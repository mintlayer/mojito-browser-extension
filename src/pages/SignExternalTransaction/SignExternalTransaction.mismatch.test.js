import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, within } from '@testing-library/react'

import { MOCKS } from './mocks'

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
    // the coin amount row carries the network ticker
    expect(
      within(screen.getByTestId('transaction-summary')).getByText('10 TML'),
    ).toBeInTheDocument()
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

  // SECURITY REGRESSION: the entries INSIDE the legs are dApp-controlled
  // too. A null/undefined entry used to crash the type detection during
  // render (ErrorBoundary wedge, Decline unreachable); a number, a string
  // or an object without a type rendered with Approve enabled for a payload
  // the signer can never encode. An entry that cannot be verified must
  // block approval instead. The real inputs are kept where not overridden.
  it.each([
    ['a null output (no inputs)', { inputs: [], outputs: [null] }],
    ['a null input (no outputs)', { inputs: [null], outputs: [] }],
    ['an undefined output', { outputs: [undefined] }],
    ['a number output', { outputs: [42] }],
    ['an output without a type', { outputs: [{}] }],
    ['a string output', { outputs: ['abc'] }],
    // SECURITY REGRESSION: a JSON object with an own non-callable
    // `toString` cannot be converted to a string or a number, so using it
    // as a label, an object key or a parseInt argument threw during render
    // (ErrorBoundary wedge, Decline unreachable). The shadowed output type
    // was already unverified, yet the type detection still ran on it.
    [
      'an output whose type shadows toString',
      { outputs: [{ type: { toString: 1 } }] },
    ],
    [
      'an account command that shadows toString',
      {
        inputs: [
          { input: { input_type: 'AccountCommand', command: { toString: 1 } } },
        ],
      },
    ],
    [
      'a token id that shadows toString',
      {
        outputs: [
          {
            type: 'Transfer',
            destination: 'tmt1qattackerdestination',
            value: { token_id: { toString: 1 }, amount: { atoms: '1000' } },
          },
        ],
      },
    ],
    [
      'a token decimals value that shadows toString',
      {
        outputs: [
          {
            type: 'IssueFungibleToken',
            total_supply: { type: 'Fixed', amount: { atoms: '1' } },
            number_of_decimals: { toString: 1 },
          },
        ],
      },
    ],
  ])('blocks approval on %s', (_description, legs) => {
    const request = JSON.parse(JSON.stringify(honestRequest))
    Object.assign(request.request.data.txData.JSONRepresentation, legs)

    expect(() => renderSignPage(request)).not.toThrow()

    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeDisabled()
  })

  // SECURITY REGRESSION: a non-string intent is an object, which cannot be
  // a React child — rendering the intent row threw behind the ErrorBoundary,
  // with Decline unreachable. An intent that is present but not a string is
  // malformed: it blocks approval and is never rendered.
  it.each([
    ['an object intent', {}],
    ['a shadowing intent', { toString: 1 }],
    ['a number intent', 42],
  ])('blocks approval on %s', (_description, intent) => {
    const request = JSON.parse(JSON.stringify(honestRequest))
    request.request.data.txData.intent = intent

    expect(() => renderSignPage(request)).not.toThrow()

    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeDisabled()
    expect(screen.queryByTestId('intent-raw')).not.toBeInTheDocument()
  })

  // The blocked screen must not interpret the payload at all: a fixed
  // operation label and no amount or fee row are derived from it.
  it('shows a fixed label and no amounts on the blocked screen', () => {
    const request = JSON.parse(JSON.stringify(honestRequest))
    request.request.data.txData.JSONRepresentation.outputs = [
      {
        type: 'Transfer',
        destination: 'tmt1qattackerdestination',
        value: { token_id: { toString: 1 }, amount: { atoms: '1000' } },
      },
    ]

    renderSignPage(request)

    const summary = screen.getByTestId('transaction-summary')
    expect(within(summary).getByText('Transaction')).toBeInTheDocument()
    expect(within(summary).queryByText('Amount')).not.toBeInTheDocument()
    expect(within(summary).queryByText('Network fee')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeDisabled()
  })
})

// An object with an own non-callable `toString`: it throws wherever a
// payload value is used as a string or a number (label, object key,
// parseInt argument).
const PRIMITIVE_SHADOW = { toString: 1 }

// Every leaf path of a JSON value (arrays and plain objects walked).
const leafPaths = function* (value, path = []) {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      yield* leafPaths(value[key], path.concat(key))
    }
  } else {
    yield path
  }
}

// A deep copy of `root` with the value at `path` replaced.
const withLeaf = (root, path, replacement) => {
  const copy = JSON.parse(JSON.stringify(root))
  const parent = path.slice(0, -1).reduce((node, key) => node[key], copy)
  parent[path[path.length - 1]] = replacement
  return copy
}

// The page generates the HTLC secret itself and, for an Htlc OUTPUT whose
// secret hash is missing, overwrites secret_hash.hex/.string before display
// (the "HTLC Secret Generated" section appears) — a shadow planted exactly
// there never reaches the screen, so that output leaf is not expected to
// block. The wallet never overwrites anything on an input.
const isGeneratedSecretField = (path) =>
  path[path.length - 3] === 'htlc' &&
  path[path.length - 2] === 'secret_hash' &&
  ['hex', 'string'].includes(path[path.length - 1])

// SECURITY REGRESSION (generative): the page fixtures cover every input
// and output type the approval handles. Replacing ANY leaf of the payload
// with an object that cannot be converted to a primitive must never throw
// during render or in the page effect; a leaf inside a leg entry is
// unverifiable and must block approval (unless the wallet overwrote it).
// One test per leaf, so a failure names the exact fixture and path.
const JSON_PATH = ['request', 'data', 'txData', 'JSONRepresentation']
const LEAF_CASES = Object.entries(MOCKS).flatMap(([name, mock]) =>
  Array.from(leafPaths(mock.request.data.txData.JSONRepresentation)).map(
    (path) => ({ name, path, label: path.join('.') }),
  ),
)

describe('SignTransactionPage — every payload leaf replaced by a primitive-shadowing object', () => {
  it.each(LEAF_CASES)(
    'renders fail-closed for $name at $label',
    ({ name, path }) => {
      const request = withLeaf(
        MOCKS[name],
        [...JSON_PATH, ...path],
        PRIMITIVE_SHADOW,
      )

      renderSignPage(request)

      // the page rendered (no ErrorBoundary wedge) and Decline is reachable
      expect(screen.getByText('Decline')).toBeInTheDocument()
      const approve = screen.getByText('Approve and return to page')
      const overwritten =
        path[0] === 'outputs' &&
        isGeneratedSecretField(path) &&
        screen.queryByText('HTLC Secret Generated') !== null
      if ((path[0] === 'inputs' || path[0] === 'outputs') && !overwritten) {
        expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
        expect(
          screen.getByText(/Amount verification failed/),
        ).toBeInTheDocument()
        expect(approve).toBeDisabled()
      }
    },
  )
})

// Render-phase sweep of the rest of the dApp request: every top-level field
// of request.data and request.data.txData replaced by each non-string value
// below. Fields the page reads only on submit must not change the verdict;
// fields it reads during render must either block approval or leave the
// "no pending request" state — never throw.
const REQUEST_REPLACEMENTS = [
  ['a shadowing object', { toString: 1 }],
  ['an empty object', {}],
  ['an array', []],
  ['a number', 42],
]
const REQUEST_FIELDS = [
  // read during render: malformed → blocked
  [['request', 'data', 'txData', 'JSONRepresentation'], 'blocked'],
  [['request', 'data', 'txData', 'intent'], 'blocked'],
  // read during render: without it there is no request to approve
  [['request', 'data', 'txData'], 'unavailable'],
  // read only on submit (or not at all): the verdict is the honest one
  [['request', 'data', 'chain'], 'ignored'],
  [['request', 'data', 'txData', 'BINRepresentation'], 'ignored'],
  [['request', 'data', 'txData', 'HEXRepresentation_unsigned'], 'ignored'],
  [['request', 'data', 'txData', 'transaction_id'], 'ignored'],
  [['request', 'data', 'txData', 'htlc'], 'ignored'],
]

describe('SignTransactionPage — every request field replaced by a non-string value', () => {
  it.each(REQUEST_FIELDS)(
    'renders fail-closed when %s is replaced',
    (path, expectation) => {
      REQUEST_REPLACEMENTS.forEach(([label, replacement]) => {
        const request = withLeaf(honestRequest, path, replacement)
        let rendered
        try {
          rendered = renderSignPage(request)
        } catch (error) {
          throw new Error(
            `${JSON.stringify(path)} = ${label} threw: ${error.message}`,
          )
        }

        try {
          const approve = screen.getByText('Approve and return to page')
          expect(screen.getByText('Decline')).toBeInTheDocument()
          if (expectation === 'blocked') {
            expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
            expect(approve).toBeDisabled()
          } else {
            expect(
              screen.queryByTestId('approval-blocked'),
            ).not.toBeInTheDocument()
          }
          if (expectation === 'unavailable') {
            expect(
              screen.getByText('No pending sign request.'),
            ).toBeInTheDocument()
            expect(approve).toBeDisabled()
          }
          if (expectation === 'ignored') {
            expect(approve).toBeEnabled()
          }
        } finally {
          rendered.unmount()
        }
      })
    },
  )
})
