import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import { format } from 'date-fns'
import { sendPopupResponse } from '@Browser'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { Account } from '@Entities'
import { ORDER_FILL_UNREADABLE_MESSAGE } from '../../utils/Helpers/ML/TransactionAmounts'

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

// The submit flow fetches chain order data for a FillOrder/ConcludeOrder
// input before reaching the signer; the sinks below stay mocked instead.
jest.mock('@APIs', () => {
  const actual = jest.requireActual('@APIs')
  return {
    __esModule: true,
    ...actual,
    Mintlayer: {
      ...actual.Mintlayer,
      getOrderById: jest.fn(),
    },
  }
})

// The signing flow is exercised through its three sinks only: every helper
// stays real (amount reconciliation, type flags, summary rendering) and a
// request that must never reach the signer is observable as "sink never
// called". Mocking the DEEP module keeps the @Helpers barrel's own circular
// imports resolving exactly as in production.
jest.mock('../../utils/Helpers/ML/SignTransaction', () => {
  const actual = jest.requireActual('../../utils/Helpers/ML/SignTransaction')
  return {
    __esModule: true,
    ...actual,
    getTransactionBINrepresentation: jest.fn(() => ({
      inputs: [new Uint8Array([1])],
      outputs: [new Uint8Array([2])],
      transactionsize: 10,
      feeRate: '100000000',
    })),
    getTransactionHEX: jest.fn(() => 'aabbccdd'),
    getTransactionIntent: jest.fn(() => 'eeff0011'),
  }
})

// The mocked unlockAccount yields a fake private key; keep the wallet-key
// derivation out of the test with the same deep-module strategy.
jest.mock('../../services/Crypto/Mintlayer/Mintlayer', () => {
  const actual = jest.requireActual('../../services/Crypto/Mintlayer/Mintlayer')
  return {
    __esModule: true,
    ...actual,
    getWalletPrivKeysList: jest.fn(() => ({
      mlReceivingPrivKeys: {},
      mlChangePrivKeys: {},
    })),
  }
})

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

// The signer encodes `destination` for Transfer, LockThenTransfer and
// CreateDelegationId outputs only. An Htlc output pays to its spend/refund
// keys and a DelegateStaking output escrows into its delegation whatever
// address the payload attaches to it, so a wallet address on one of them
// must hide nothing: the escrowed funds are summed into the Amount row and
// the wallet's address never becomes the "To" line. Such a transaction is
// legitimate — the full amount leaving the wallet is shown and approval
// stays available.
const OWN_RECEIVING = 'tmt1qwalletreceiving'
const DAPP_TRANSFER = {
  destination: 'tmt1qattackerdestination',
  type: 'Transfer',
  value: { type: 'Coin', amount: { atoms: '1000000000000', decimal: '10' } },
}
const ESCROWED = { atoms: '1607148604300000', decimal: '16071.486043' }
const htlcEscrow = (decoyField) => ({
  type: 'Htlc',
  ...(decoyField ? { [decoyField]: OWN_RECEIVING } : {}),
  value: { type: 'Coin', amount: ESCROWED },
  htlc: {
    refund_key: 'tmt1qdapprefundkey',
    refund_timelock: { content: 20, type: 'ForBlockCount' },
    secret_hash: {
      hex: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3',
      string: null,
    },
    spend_key: 'tmt1qdappspendkey',
  },
})
const stakingEscrow = (decoyField) => ({
  type: 'DelegateStaking',
  ...(decoyField ? { [decoyField]: OWN_RECEIVING } : {}),
  amount: ESCROWED,
  delegation_id:
    'tdelg1d57nmkp24k0rh0fgsjnjy78wxql8wvgr420ncdsesvssvdgfcg6sx6262w',
})
// the summary shows an address as `head(10)…tail(8)` when longer than
// 21 characters, in full otherwise
const shown = (address) =>
  address.length > 21 ? `${address.slice(0, 10)}…${address.slice(-8)}` : address

// Expected per case: whether a visible transfer sits beside the escrow, the
// Amount row, and the "To" line (null: the neutral placeholder).
const WITH_TRANSFER = {
  transfer: true,
  amount: '16081.486043 TML',
  to: DAPP_TRANSFER.destination,
}
const ALONE = { transfer: false, amount: '16071.486043 TML', to: null }

const escrowRequest = (escrowOutput, besideTransfer) => {
  const request = JSON.parse(JSON.stringify(honestRequest))
  request.request.data.txData.JSONRepresentation.outputs = besideTransfer
    ? [DAPP_TRANSFER, escrowOutput]
    : [escrowOutput]
  return request
}

describe('SignTransactionPage — value-bearing outputs tagged with a wallet address', () => {
  it.each([
    ['Htlc without any address (control)', htlcEscrow(null), WITH_TRANSFER],
    [
      'Htlc with destination = wallet address',
      htlcEscrow('destination'),
      WITH_TRANSFER,
    ],
    [
      'Htlc with address = wallet address',
      htlcEscrow('address'),
      WITH_TRANSFER,
    ],
    [
      'DelegateStaking with destination = wallet address',
      stakingEscrow('destination'),
      WITH_TRANSFER,
    ],
    [
      'Htlc with destination = wallet address as the only output',
      htlcEscrow('destination'),
      ALONE,
    ],
  ])(
    'shows the escrowed funds for %s',
    (_description, escrowOutput, expected) => {
      renderSignPage(escrowRequest(escrowOutput, expected.transfer))

      const summary = screen.getByTestId('transaction-summary')
      // 10 ML to the site + 16071.486043 ML escrowed in one combined row, or
      // the escrowed amount alone
      expect(within(summary).getByText(expected.amount)).toBeInTheDocument()

      // the "To" line never shows the wallet's own address for the escrow:
      // it is the Transfer's destination, or the neutral placeholder
      expect(within(summary).getByText('To')).toBeInTheDocument()
      expect(
        within(summary).queryByText('To (your address)'),
      ).not.toBeInTheDocument()
      // the wallet address appears as From only
      expect(within(summary).queryAllByText(shown(OWN_RECEIVING))).toHaveLength(
        1,
      )
      if (expected.to) {
        expect(
          within(summary).getByText(shown(expected.to)),
        ).toBeInTheDocument()
        // From and To each have a copy button
        expect(screen.getAllByTestId('copy-btn')).toHaveLength(2)
      } else {
        // no output carries a destination the signer encodes: the neutral
        // placeholder, and only From has a copy button
        expect(within(summary).getByText('—')).toBeInTheDocument()
        expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
      }

      // the payload is consistent and legitimate: nothing is blocked
      expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
      expect(screen.getByText('Approve and return to page')).toBeEnabled()
    },
  )
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

// SECURITY REGRESSION: the page fixtures cover every input
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

// A LockThenTransfer output addressed to one of the wallet's own addresses
// brings the funds back encumbered by the site's chosen lock: the summary
// must say so in plain words — the amount and the lock on their own row —
// instead of hiding the output like plain change. A lock the signer could
// not encode fails closed before the signer is reached.
const OWN_CHANGE = 'tmt1qwalletchange'
const PAYEE = 'tmt1qpayeedestination'
const LOCKED_ROW_LABEL = 'Locked at this wallet'
const LOCK_UNREADABLE =
  'The lock on these funds cannot be read, so this transaction cannot be signed'
const UNTIL_2100 = { type: 'UntilTime', content: { timestamp: 4102444800 } }
const FOR_7200_BLOCKS = { type: 'ForBlockCount', content: '7200' }
// the lock timestamp is rendered with the wallet's own date format
const UNTIL_2100_TEXT = `until ${format(
  new Date(4102444800 * 1000),
  'dd/MM/yyyy HH:mm',
)}`

// Exact decimal string → atoms string at coin scale (11 decimals).
const toAtoms = (decimal) => {
  const [whole, fraction = ''] = String(decimal).split('.')
  const digits = (fraction + '0'.repeat(11)).slice(0, 11)
  return `${whole}${digits}`.replace(/^0+(?=\d)/, '')
}
// A coin value whose label matches its atoms unless an override is given.
const coinValue = (decimal, atoms = toAtoms(decimal)) => ({
  type: 'Coin',
  amount: { decimal, atoms },
})
const utxoInput = (destination, decimal, atoms) => ({
  input: {
    index: 0,
    input_type: 'UTXO',
    source_id:
      '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
    source_type: 'Transaction',
  },
  utxo: { destination, value: coinValue(decimal, atoms) },
})
const paymentToPayee = {
  destination: PAYEE,
  type: 'Transfer',
  value: coinValue('1'),
}
const lockedChange = (lock, decimal = '99', atoms) => ({
  destination: OWN_CHANGE,
  type: 'LockThenTransfer',
  lock,
  value: coinValue(decimal, atoms),
})
const lockedRequest = (outputs, inputs) => ({
  request: {
    origin: 'https://app.example',
    requestId: 'locked-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: { JSONRepresentation: { inputs, outputs } },
    },
  },
})
const HUNDRED_IN = [utxoInput(OWN_RECEIVING, '100')]

// the value cell of the summary's locked row
const lockedRowValue = (summary) =>
  within(summary).getByText(LOCKED_ROW_LABEL).nextElementSibling

describe('SignTransactionPage — locked outputs returning to this wallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Account.hasPasskey.mockResolvedValue(false)
    Account.unlockAccount.mockResolvedValue({
      mlPrivKeys: { mlTestnetPrivateKey: 'test-private-key' },
    })
  })

  // The payload as a site sends it: the payment the user expects, next to
  // the whole remainder coming back locked until 2100.
  const paymentAndLockedChange = lockedRequest(
    [paymentToPayee, lockedChange(UNTIL_2100)],
    HUNDRED_IN,
  )

  it('shows the locked change with its amount and lock, and stays approvable', () => {
    renderSignPage(paymentAndLockedChange)

    const summary = screen.getByTestId('transaction-summary')
    expect(within(summary).getByText('Send')).toBeInTheDocument()
    expect(within(summary).getByText(shown(PAYEE))).toBeInTheDocument()
    // the Amount row is the payment alone
    expect(within(summary).getByText('1 TML')).toBeInTheDocument()
    expect(within(summary).getAllByText('Amount')).toHaveLength(1)
    // the locked remainder is its own visible row, outside the technical details
    expect(within(summary).getByText(LOCKED_ROW_LABEL)).toBeInTheDocument()
    expect(lockedRowValue(summary)).toHaveTextContent(
      `99 TML, ${UNTIL_2100_TEXT}`,
    )
    expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument()
    // the fee counts the locked output: 100 − 1 − 99
    expect(within(summary).getByText('0 TML')).toBeInTheDocument()

    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeEnabled()
  })

  it('blocks a lying decimal on the locked amount', () => {
    renderSignPage(
      lockedRequest(
        [paymentToPayee, lockedChange(UNTIL_2100, '1', toAtoms('99'))],
        HUNDRED_IN,
      ),
    )

    const summary = screen.getByTestId('transaction-summary')
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeDisabled()
    expect(lockedRowValue(summary)).toHaveTextContent(
      `will sign 99 TML, ${UNTIL_2100_TEXT}`,
    )
    // the site's "1" label is never shown as the locked amount: the row
    // leads with the verification error, not with a number
    expect(lockedRowValue(summary)).not.toHaveTextContent(/^1 TML/)
  })

  it('shows amount and lock when the locked output is the only one', () => {
    renderSignPage(
      lockedRequest(
        [lockedChange(UNTIL_2100)],
        [utxoInput(OWN_RECEIVING, '99')],
      ),
    )

    const summary = screen.getByTestId('transaction-summary')
    expect(within(summary).getByText(LOCKED_ROW_LABEL)).toBeInTheDocument()
    expect(lockedRowValue(summary)).toHaveTextContent(
      `99 TML, ${UNTIL_2100_TEXT}`,
    )
    // nothing is paid to others and no amount is hidden
    expect(within(summary).queryByText('Amount')).not.toBeInTheDocument()
    expect(within(summary).getByText('To')).toBeInTheDocument()
    expect(within(summary).getByText('—')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeEnabled()
  })

  // A delegation withdrawal as the SDK builds it: one DelegationBalance
  // input, one LockThenTransfer coin output back to the wallet locked for
  // the staking maturity. Truthful on the summary, and it signs as before.
  it('shows a delegation withdrawal with its block lock and signs it through the existing flow', async () => {
    const delegationWithdrawal = lockedRequest(
      [
        {
          destination: OWN_RECEIVING,
          type: 'LockThenTransfer',
          lock: FOR_7200_BLOCKS,
          value: coinValue('8'),
        },
      ],
      [
        {
          input: {
            input_type: 'Account',
            account_type: 'DelegationBalance',
            delegation_id:
              'tdelg1mfust4vvrn3xy6slm9qvtf8kjlzw4ezspkqwenfnzryyeumgdahqp2upjz',
            // the signer reads input.amount.atoms directly on a withdrawal
            amount: { decimal: '10', atoms: toAtoms('10') },
            nonce: 1,
          },
        },
      ],
    )

    renderSignPage(delegationWithdrawal)

    const summary = screen.getByTestId('transaction-summary')
    expect(
      within(summary).getByText('Withdraw from delegation'),
    ).toBeInTheDocument()
    expect(within(summary).getByText(LOCKED_ROW_LABEL)).toBeInTheDocument()
    expect(lockedRowValue(summary)).toHaveTextContent('8 TML, for 7200 blocks')
    expect(within(summary).queryByText('Amount')).not.toBeInTheDocument()
    // 10 credited in − 8 locked back out
    expect(within(summary).getByText('2 TML')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()

    // the password approval path reaches the signer and answers the site
    fireEvent.click(screen.getByText('Approve and return to page'))
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() =>
      expect(sendPopupResponse).toHaveBeenCalledWith({
        method: 'signTransaction_approve',
        requestId: 'locked-1',
        origin: 'https://app.example',
        result: 'aabbccdd',
      }),
    )
    // the signer received the withdrawal as the site built it, lock included
    expect(SignTxHelpers.getTransactionBINrepresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        inputs:
          delegationWithdrawal.request.data.txData.JSONRepresentation.inputs,
        outputs: [
          expect.objectContaining({
            type: 'LockThenTransfer',
            lock: FOR_7200_BLOCKS,
          }),
        ],
      }),
      expect.anything(),
      expect.anything(),
    )
  })

  // getOutputs throws on each of these: the request can never be signed,
  // so approval fails closed with the reason and the signer is never reached.
  it.each([
    ['a missing lock', undefined],
    ['an unknown lock type', { type: 'ForSeconds', content: 30 }],
    ['a non-numeric block count', { type: 'ForBlockCount', content: 'soon' }],
    ['a negative block count', { type: 'ForBlockCount', content: -7200 }],
    [
      'a non-numeric UntilTime timestamp',
      {
        type: 'UntilTime',
        content: { timestamp: 'soon' },
      },
    ],
  ])('blocks approval on %s', (_description, lock) => {
    renderSignPage(
      lockedRequest([paymentToPayee, lockedChange(lock)], HUNDRED_IN),
    )

    const summary = screen.getByTestId('transaction-summary')
    expect(lockedRowValue(summary)).toHaveTextContent(LOCK_UNREADABLE)
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    const approve = screen.getByText('Approve and return to page')
    expect(approve).toBeDisabled()

    // a click on the disabled button opens nothing and reaches no signer
    fireEvent.click(approve)
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
    expect(SignTxHelpers.getTransactionBINrepresentation).not.toHaveBeenCalled()
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })

  // Unchanged behaviour: a plain Transfer to one of the wallet's own
  // addresses is change (no row), and a locked output to a foreign address
  // is a payment row as today.
  it('keeps a plain Transfer to the wallet as change and a foreign locked output as a payment', () => {
    renderSignPage(
      lockedRequest(
        [
          paymentToPayee,
          { destination: OWN_CHANGE, type: 'Transfer', value: coinValue('40') },
          {
            destination: 'tmt1qotherlockeddestination',
            type: 'LockThenTransfer',
            lock: UNTIL_2100,
            value: coinValue('59'),
          },
        ],
        HUNDRED_IN,
      ),
    )

    const summary = screen.getByTestId('transaction-summary')
    expect(
      within(summary).queryByText(LOCKED_ROW_LABEL),
    ).not.toBeInTheDocument()
    expect(within(summary).queryByText('40 TML')).not.toBeInTheDocument()
    expect(within(summary).getByText('60 TML')).toBeInTheDocument()
    expect(within(summary).queryByText(/until /)).not.toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeEnabled()
  })

  // The signer has to encode every LockThenTransfer lock it meets — on an
  // output paid to someone else, on a spent locked output, and even on a
  // utxo object injected into an account-command input (getTransactionHEX
  // re-encodes every such utxo through getOutputs before it decides, by
  // input type, whether to keep the bytes). One it could not encode can
  // never be signed: approval fails closed with the reason, in step with
  // the technical preview, and nothing is left for the error boundary.
  const foreignLocked = (lock) => ({
    destination: 'tmt1qotherlockeddestination',
    type: 'LockThenTransfer',
    lock,
    value: coinValue('59'),
  })
  const spentLockedInput = (lock) => ({
    input: {
      index: 0,
      input_type: 'UTXO',
      source_id:
        '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
      source_type: 'Transaction',
    },
    utxo: {
      type: 'LockThenTransfer',
      destination: OWN_RECEIVING,
      lock,
      value: coinValue('100'),
    },
  })

  it.each([
    [
      'a locked output paid to someone else with an unknown lock type',
      lockedRequest(
        [paymentToPayee, foreignLocked({ type: 'Nope' })],
        HUNDRED_IN,
      ),
      'Amount',
    ],
    [
      'a spent locked output with a missing lock',
      lockedRequest([paymentToPayee], [spentLockedInput(undefined)]),
      'Locked input',
    ],
    [
      'a locked utxo injected into a FillOrder input with a missing lock',
      lockedRequest(
        [paymentToPayee],
        [
          {
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              nonce: '0',
            },
            utxo: spentLockedInput(undefined).utxo,
          },
        ],
      ),
      'Locked input',
    ],
  ])('blocks approval on %s', (_description, request, rowLabel) => {
    expect(() => renderSignPage(request)).not.toThrow()
    expect(screen.getByText('Decline')).toBeInTheDocument()

    const summary = screen.getByTestId('transaction-summary')
    expect(
      within(summary).getByText(rowLabel).nextElementSibling,
    ).toHaveTextContent(LOCK_UNREADABLE)
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()
    const approve = screen.getByText('Approve and return to page')
    expect(approve).toBeDisabled()

    // a click on the disabled button opens nothing and reaches no signer
    fireEvent.click(approve)
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
    expect(SignTxHelpers.getTransactionBINrepresentation).not.toHaveBeenCalled()
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })
})

// A FillOrder input commits the order fill size from `fill_atoms`, which the
// signer stringifies and feeds to the amount encoder — decimal digits only.
// A shape the wallet cannot display (an array, an object, a boolean, an
// absent field) can never encode: approval must fail closed on a row naming
// the fill leg, and the signer must never be reached.
const fillOrderRequest = (fillAtoms) => {
  const request = JSON.parse(JSON.stringify(MOCKS.fillorder))
  // the submit flow checks the network the site was granted on
  request.request.network = 'testnet'
  const fillInput = request.request.data.txData.JSONRepresentation.inputs.find(
    (input) => input.input?.command === 'FillOrder',
  )
  if (fillAtoms === undefined) {
    delete fillInput.input.fill_atoms
  } else {
    fillInput.input.fill_atoms = fillAtoms
  }
  return request
}

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const { Mintlayer } = require('@APIs')

const fillRowValue = (summary) =>
  within(summary).getByText('Order fill').nextElementSibling

describe('SignTransactionPage — order fill amounts this wallet cannot display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Account.hasPasskey.mockResolvedValue(false)
    Account.unlockAccount.mockResolvedValue({
      mlPrivKeys: { mlTestnetPrivateKey: 'test-private-key' },
    })
  })

  it.each([
    ['an array', ['10000000000000']],
    ['an object', {}],
    ['a boolean', true],
    ['null', null],
    ['no field at all', undefined],
  ])('blocks approval when fill_atoms is %s', (_description, fillAtoms) => {
    renderSignPage(fillOrderRequest(fillAtoms))

    // the fill leg is named and fails closed with the reason
    const summary = screen.getByTestId('transaction-summary')
    expect(fillRowValue(summary)).toHaveTextContent(
      ORDER_FILL_UNREADABLE_MESSAGE,
    )
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText(/Amount verification failed/)).toBeInTheDocument()

    // a click on the disabled button opens nothing and reaches no signer
    const approve = screen.getByText('Approve and return to page')
    expect(approve).toBeDisabled()
    fireEvent.click(approve)
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
    expect(SignTxHelpers.getTransactionBINrepresentation).not.toHaveBeenCalled()
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })

  // A well-formed fill (a plain atom string) is displayed verbatim and signs
  // through the existing flow — the site receives the signed transaction.
  it('shows the fill size and signs the request as before', async () => {
    Mintlayer.getOrderById.mockResolvedValue(
      JSON.stringify({
        ask_currency: { type: 'Coin' },
        give_currency: { type: 'Coin' },
        initially_asked: { atoms: '1000000000000' },
        initially_given: { atoms: '50000' },
        ask_balance: { atoms: '900000000000' },
        give_balance: { atoms: '40000' },
      }),
    )

    renderSignPage(fillOrderRequest('1000000000000'))

    const summary = screen.getByTestId('transaction-summary')
    // bare atom string, no scale in the payload → shown verbatim
    expect(fillRowValue(summary)).toHaveTextContent('1000000000000')
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeEnabled()

    fireEvent.click(screen.getByText('Approve and return to page'))
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() =>
      expect(sendPopupResponse).toHaveBeenCalledWith({
        method: 'signTransaction_approve',
        requestId: 'wymzne7u81',
        origin: 'http://localhost:8080',
        result: 'aabbccdd',
      }),
    )
    expect(SignTxHelpers.getTransactionHEX).toHaveBeenCalled()
  })

  // A ConcludeOrder leg carries no fill amount: no fill row, and approval
  // stays reachable exactly as before. The mock's token output is dropped —
  // the harness wallet holds no chain token metadata, so its scale cannot
  // be verified and the payload would block for that unrelated reason.
  it('keeps a ConcludeOrder request approvable with no fill row', () => {
    const request = JSON.parse(JSON.stringify(MOCKS.concludeorder))
    request.request.network = 'testnet'
    request.request.data.txData.JSONRepresentation.outputs =
      request.request.data.txData.JSONRepresentation.outputs.filter(
        (output) => !output?.value?.token_id,
      )

    renderSignPage(request)

    const summary = screen.getByTestId('transaction-summary')
    expect(within(summary).queryByText('Order fill')).not.toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
    expect(screen.getByText('Approve and return to page')).toBeEnabled()
  })
})
