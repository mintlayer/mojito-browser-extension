import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { ErrorBoundary } from '@BasicComponents'

import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { sendPopupResponse } from '@Browser'
import { MOCKS } from './mocks'
import { SignBitcoinTransactionPage } from './SignBitcoinTransaction'

// Keep the output readable: swallow React's error-logging noise.
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
    windows: api.windows,
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

// Render is the surface under test. The signer's UTXO-value rule is the
// real one (the claim/refund verdicts depend on it); the escrow script
// builder cannot run in this realm (bitcoinjs rejects the Buffer polyfill
// here), so it is a stand-in that resolves for a well-formed create request
// and rejects values that cannot be read as script parameters. It is
// stricter than the real builder (which accepts an array and truncates
// non-hex strings) and equal for the probed value, a shadowing object.
// Everything that needs keys, UTXOs or the network is stubbed so the
// create-request escrow pre-computation completes.
jest.mock('@Cryptos', () => {
  const actual = jest.requireActual('../../services/Crypto/BTC/BTCTransaction')
  return {
    __esModule: true,
    BTC: {},
    BTC_ADDRESS_TYPE_ENUM: {
      LEGACY: 'legacy',
      P2SH: 'p2sh',
      NATIVE_SEGWIT: 'nativeSegwit',
    },
    BTCTransaction: {
      HTLC_CLAIM_FEE_SATOSHIS: actual.HTLC_CLAIM_FEE_SATOSHIS,
      HTLC_REFUND_FEE_SATOSHIS: actual.HTLC_REFUND_FEE_SATOSHIS,
      toSatoshiBigInt: actual.toSatoshiBigInt,
      findWalletKeyForRedeemScript: jest.fn(),
      buildHTLCAndFundingAddress: jest.fn(),
      calculateBtcTransactionFee: jest.fn(),
      buildTransaction: jest.fn(),
      buildHtlcClaimTx: jest.fn(),
      buildHtlcRefundTx: jest.fn(),
    },
  }
})

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

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'request-values-account',
      addresses: {},
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({
      btcUtxos: [],
      unusedAddresses: {},
    }),
    MintlayerContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// Mounts the page inside the shipped ErrorBoundary, like the panel and
// popup do, so a render crash shows up as the "Something went wrong"
// fallback instead of going unnoticed by the assertions.
const renderSignPage = (initialState) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/sign-btc', state: initialState }]}
    >
      <ErrorBoundary>
        <Routes>
          <Route
            path="/sign-btc"
            element={<SignBitcoinTransactionPage />}
          />
        </Routes>
      </ErrorBoundary>
    </MemoryRouter>,
  )

// The create-request escrow pre-computation resolves asynchronously after
// the mount; let it settle so every case is inspected in the same state.
const settlePage = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

// The error the boundary caught, or null when the page rendered.
const boundaryMessage = () =>
  screen.queryByTestId('error-boundary-message')?.textContent ?? null

const approveButton = () => screen.getByText('Approve and return to page')

// A deep copy of `root` with the value at `path` replaced.
const withValue = (root, path, replacement) => {
  const copy = JSON.parse(JSON.stringify(root))
  const parent = path.slice(0, -1).reduce((node, key) => node[key], copy)
  parent[path[path.length - 1]] = replacement
  return copy
}

// An object with an own non-callable `toString`: it throws wherever a
// value is used as a string or a number (template literal, String(), Number()).
const PRIMITIVE_SHADOW = { toString: 1 }

const PROBE_VALUES = [
  ['{}', {}],
  ['{"toString":1}', PRIMITIVE_SHADOW],
  ['[]', []],
  ['[{}]', [{}]],
  ['42', 42],
  ['"abc"', 'abc'],
  ['null', null],
]

// Every request field the page (or a component it renders) touches during
// render, each probed on the page's own fixture for that request kind.
// `kind` selects the fail-closed verdict for a value that cannot be used:
//   envelope    — the request envelope: any replacement hides the request
//   payload     — the payload root: falsy hides the request, anything that
//                 is not an object is an unrecognised request
//   text        — rendered as text (the site badge)
//   approvable   — the value is not needed to approve or sign the request
//   createFlag  — truthy keeps the create shape (the wallet replaces the
//                 value), falsy turns the request into an unrecognised one
//   type        — anything but the fixture's own type is an unrecognised request
//   amount      — a create amount that is not a number cannot be shown or signed
//   lock        — a locktime that is not a decimal count cannot be shown or signed
//   to          — a claim/refund destination that is not text cannot be used
//   utxoValue   — a claim/refund amount that cannot be read cannot be shown
//   blocked     — the value is always unreadable
const JSON_PATH = ['request', 'data', 'txData', 'JSONRepresentation']
const RENDER_READ_FIELDS = [
  // the request envelope and the payload root
  [['request'], 'spendHtlc', 'envelope'],
  [['request', 'data'], 'spendHtlc', 'envelope'],
  [['request', 'data', 'txData'], 'spendHtlc', 'envelope'],
  [[...JSON_PATH], 'spendHtlc', 'payload'],
  // site badge (browser-stamped, rendered as text)
  [['request', 'origin'], 'spendHtlc', 'text'],
  // read only when signing: must not change the verdict
  [['request', 'network'], 'spendHtlc', 'approvable'],
  [['request', 'requestId'], 'spendHtlc', 'approvable'],
  // payload fields read during render
  [[...JSON_PATH, 'secretHash'], 'createHtlc', 'createFlag'],
  [[...JSON_PATH, 'secret'], 'spendHtlc2', 'approvable'],
  [[...JSON_PATH, 'type'], 'spendHtlc', 'type'],
  [[...JSON_PATH, 'amount'], 'createHtlc', 'amount'],
  [[...JSON_PATH, 'timeoutBlocks'], 'createHtlc', 'lock'],
  [[...JSON_PATH, 'to'], 'spendHtlc', 'to'],
  [[...JSON_PATH, 'to'], 'refundHtlc', 'to'],
  // any replacement drops the value the claim amount is read from
  [[...JSON_PATH, 'utxo'], 'spendHtlc', 'blocked'],
  [[...JSON_PATH, 'utxo', 'value'], 'spendHtlc', 'utxoValue'],
  [[...JSON_PATH, 'utxo', 'value'], 'refundHtlc', 'utxoValue'],
]

// Expected verdict per field kind and probed value: 'approvable' keeps
// Approve enabled, 'blocked' shows the request with Approve disabled,
// 'unavailable' shows that there is no request.
const verdictFor = (kind, value) => {
  switch (kind) {
    case 'envelope':
      return 'unavailable'
    case 'payload':
      return value ? 'blocked' : 'unavailable'
    case 'createFlag':
      return value ? 'approvable' : 'blocked'
    case 'amount':
      return value === 42 ? 'approvable' : 'blocked'
    case 'lock':
      return value === 42 ? 'approvable' : 'blocked'
    case 'to':
      // an absent destination is legitimate: the wallet pays itself
      return value == null || typeof value === 'string'
        ? 'approvable'
        : 'blocked'
    case 'utxoValue':
      // 42 is a readable number of satoshis; nothing else is
      return value === 42 ? 'approvable' : 'blocked'
    case 'blocked':
    case 'type':
      return 'blocked'
    default:
      return 'approvable'
  }
}

const PROBE_CASES = [
  ...RENDER_READ_FIELDS.flatMap(([path, mockName, kind]) =>
    PROBE_VALUES.map(([valueLabel, value]) => ({
      path,
      mockName,
      verdict: verdictFor(kind, value),
      valueLabel,
      value,
      label: `${path.join('.')} = ${valueLabel} on ${mockName}`,
    })),
  ),
  // the type removed altogether is the fourth shape as well
  {
    path: [...JSON_PATH, 'type'],
    mockName: 'spendHtlc',
    verdict: 'blocked',
    valueLabel: 'undefined (removed)',
    value: undefined,
    label: `${[...JSON_PATH, 'type'].join('.')} = undefined (removed) on spendHtlc`,
  },
]

// The stand-in escrow builder: hex public keys and a lock that is a whole
// number of blocks build an escrow address; anything else is rejected,
// like the real builder rejects it.
const HEX = /^[0-9a-f]+$/i
const standInBuildEscrow = async ({ receiverPubKey, senderPubKey, lock }) => {
  for (const key of [receiverPubKey, senderPubKey]) {
    if (typeof key !== 'string' || !HEX.test(key)) {
      throw new Error('Invalid public key: must be a hex string')
    }
  }
  if (!Number.isInteger(parseInt(lock))) {
    throw new Error('Invalid lock: must be a number of blocks')
  }
  return { p2wshAddress: 'tb1qescrow', redeemScriptHex: 'ab' }
}

// The fee estimate completes for every case and the escrow builder runs
// the stand-in (a test may swap it, the next one gets it back); the
// verdicts below then depend only on the request values.
beforeEach(() => {
  jest.clearAllMocks()
  errorSpy.mockClear()
  BTCTransaction.buildHTLCAndFundingAddress.mockImplementation(
    standInBuildEscrow,
  )
  BTCTransaction.calculateBtcTransactionFee.mockResolvedValue(1540)
  Account.getAccount.mockResolvedValue({ walletType: 'nativeSegwit' })
})

afterAll(() => {
  errorSpy.mockRestore()
})

describe('SignBitcoinTransaction — dApp-supplied values reaching render', () => {
  it.each(PROBE_CASES)(
    'renders fail-closed when $label',
    async ({ path, mockName, verdict, value }) => {
      const state = withValue(MOCKS[mockName], path, value)

      renderSignPage(state)
      await settlePage()

      // the page rendered (no error fallback) and Decline answers
      expect(boundaryMessage()).toBeNull()
      expect(screen.getByText('Decline')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Decline'))
      expect(sendPopupResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'signTransaction_reject',
          error: 'Transaction rejected',
        }),
      )

      const approve = approveButton()
      if (verdict === 'blocked') {
        expect(approve).toBeDisabled()
        expect(screen.getByText(/cannot be approved/)).toBeInTheDocument()
        // the password modal is the only road to the signer: it never opens
        fireEvent.click(approve)
        expect(
          screen.queryByText('Re-enter your Password'),
        ).not.toBeInTheDocument()
      } else if (verdict === 'unavailable') {
        expect(approve).toBeDisabled()
        expect(screen.getByText('No pending sign request.')).toBeInTheDocument()
      } else {
        expect(approve).toBeEnabled()
        expect(screen.queryByText(/cannot be approved/)).not.toBeInTheDocument()
      }
    },
  )
})

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

// The page fixtures cover every request kind the approval handles. Replacing
// ANY leaf of the payload with an object that cannot be converted to a
// primitive must never throw during render or in the page effect. A leaf
// the page needs to verify the request is unreadable then and must block
// approval; every other leaf is either replaced by the wallet (the create
// secret hash) or read only when signing (which fails closed on its own)
// and leaves the verdict unchanged. One test per leaf, so a failure names
// the exact fixture and path.
const BLOCKING_LEAVES = [
  // shown by the recap: what is signed
  'amount',
  'timeoutBlocks',
  'to',
  'utxo.value',
  // the request shape itself
  'type',
  // the escrow address is built from them before approval
  'recipientPublicKey',
  'refundPublicKey',
]
const isBlockingLeaf = (path) => BLOCKING_LEAVES.includes(path.join('.'))

const LEAF_CASES = Object.entries(MOCKS).flatMap(([name, mock]) =>
  Array.from(leafPaths(mock.request.data.txData.JSONRepresentation)).map(
    (path) => ({ name, path, label: path.join('.') }),
  ),
)

describe('SignBitcoinTransaction — every payload leaf replaced by a primitive-shadowing object', () => {
  it.each(LEAF_CASES)(
    'renders fail-closed for $name at $label',
    async ({ name, path }) => {
      const state = withValue(
        MOCKS[name],
        [...JSON_PATH, ...path],
        PRIMITIVE_SHADOW,
      )

      renderSignPage(state)
      await settlePage()

      // the page rendered (no error fallback) and Decline is reachable
      expect(boundaryMessage()).toBeNull()
      expect(screen.getByText('Decline')).toBeInTheDocument()
      const approve = approveButton()
      if (isBlockingLeaf(path)) {
        expect(approve).toBeDisabled()
        expect(screen.getByText(/cannot be approved/)).toBeInTheDocument()
        fireEvent.click(approve)
        expect(
          screen.queryByText('Re-enter your Password'),
        ).not.toBeInTheDocument()
      } else {
        expect(approve).toBeEnabled()
      }
    },
  )
})

// The 'Escrow address' row renders as <dt>label</dt><dd>value</dd>.
const escrowAddressValue = () => {
  const label = screen.getByText('Escrow address')
  return label.parentElement.querySelector('dd')?.textContent
}

const CLAIM_DEST = MOCKS.spendHtlc2.request.data.txData.JSONRepresentation.to
const SECRET_FIELD = 'Enter htlc secret in hex format (64 characters)'

// Lets a claim request reach the claim builder: keys unlock, the redeem
// script binds a wallet key, the destination is a wallet address, and no
// secret was saved for the hash.
const stubClaimSigning = () => {
  Account.unlockAccount.mockResolvedValue({
    btcPrivateKeys: {
      btcAddressData: {
        btcReceivingAddresses: [{ address: CLAIM_DEST }],
        btcChangeAddresses: [],
      },
    },
  })
  Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
  BTCTransaction.findWalletKeyForRedeemScript.mockReturnValue({ wif: 'wif' })
  BTCTransaction.buildHtlcClaimTx.mockResolvedValue('deadbeef')
}

const openPasswordModal = () => {
  fireEvent.click(approveButton())
  return screen.getByText('Re-enter your Password')
}

const typePasswordAndApprove = () => {
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'wallet-password' },
  })
  fireEvent.click(screen.getByText('Approve'))
}

const submitPasswordModal = async () => {
  typePasswordAndApprove()
  await waitFor(() => expect(sendPopupResponse).toHaveBeenCalled())
}

describe('SignBitcoinTransaction — revealed secret, escrow address and the blocked modal', () => {
  // The revealed secret is dApp-supplied. Only a string is one: any other
  // type used to hide the manual-secret prompt and still reach the builder
  // as the secret. It now reads as none — the prompt shows and the typed
  // secret is what gets signed.
  it('prompts for the secret when the revealed secret is not a string, and signs with the typed one', async () => {
    stubClaimSigning()
    renderSignPage(
      withValue(MOCKS.spendHtlc2, [...JSON_PATH, 'secret'], PRIMITIVE_SHADOW),
    )

    expect(approveButton()).toBeEnabled()
    openPasswordModal()
    fireEvent.change(screen.getByPlaceholderText(SECRET_FIELD), {
      target: { value: 'ab'.repeat(32) },
    })
    await submitPasswordModal()

    expect(BTCTransaction.buildHtlcClaimTx).toHaveBeenCalledWith(
      expect.objectContaining({ secretHex: 'ab'.repeat(32) }),
    )
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signTransaction_approve',
        result: { signedTxHex: 'deadbeef' },
      }),
    )
  })

  it('does not prompt when the revealed secret is a string, and signs with it', async () => {
    stubClaimSigning()
    renderSignPage(MOCKS.spendHtlc2)

    openPasswordModal()
    expect(screen.queryByPlaceholderText(SECRET_FIELD)).not.toBeInTheDocument()
    await submitPasswordModal()

    expect(BTCTransaction.buildHtlcClaimTx).toHaveBeenCalledWith(
      expect.objectContaining({
        secretHex:
          MOCKS.spendHtlc2.request.data.txData.JSONRepresentation.secret,
      }),
    )
  })

  // The escrow address of a create request is built before approval. Once
  // that has run and failed, the page says so and blocks approval instead
  // of offering a sign that cannot succeed.
  it('states why and blocks approval once the escrow address could not be built', async () => {
    renderSignPage(
      withValue(
        MOCKS.createHtlc,
        [...JSON_PATH, 'recipientPublicKey'],
        PRIMITIVE_SHADOW,
      ),
    )
    await settlePage()

    expect(boundaryMessage()).toBeNull()
    expect(escrowAddressValue()).toBe('unavailable')
    expect(screen.getByText(/^Escrow address unavailable/)).toBeInTheDocument()
    expect(approveButton()).toBeDisabled()
    fireEvent.click(approveButton())
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
  })

  // While the escrow address is still being built a well-formed request is
  // unaffected: nothing is blocked, before and after the address arrives.
  it('keeps a well-formed create request approvable while its escrow address is built', async () => {
    let settleEscrow
    BTCTransaction.buildHTLCAndFundingAddress.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          settleEscrow = { resolve, reject }
        }),
    )
    renderSignPage(MOCKS.createHtlc)

    expect(escrowAddressValue()).toBe('unavailable')
    expect(screen.queryByText(/cannot be approved/)).not.toBeInTheDocument()
    expect(approveButton()).toBeEnabled()

    await act(async () => {
      settleEscrow.resolve({
        p2wshAddress: 'tb1qescrow',
        redeemScriptHex: 'ab',
      })
    })
    await waitFor(() => expect(escrowAddressValue()).toBe('tb1qescrow'))

    expect(screen.queryByText(/cannot be approved/)).not.toBeInTheDocument()
    expect(approveButton()).toBeEnabled()
  })

  // The block can arise while the password modal is already open (the
  // escrow address settling late): the modal states why, its own Approve is
  // disabled like the footer's, and nothing reaches the signer. Only the
  // escrow pre-computation stays pending; a later builder call (a submit
  // that slipped through) resolves at once, so such a slip would show up
  // as a key unlock or a response below instead of hanging unseen.
  it('disables the modal Approve and reaches no signer when the block arises while the password modal is open', async () => {
    stubClaimSigning()
    let settleEscrow
    BTCTransaction.buildHTLCAndFundingAddress.mockResolvedValueOnce(
      new Promise((resolve, reject) => {
        settleEscrow = { resolve, reject }
      }),
    )
    renderSignPage(MOCKS.createHtlc)
    openPasswordModal()
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    // the escrow address is still pending: nothing is blocked yet
    expect(screen.getByText('Approve')).toBeEnabled()

    await act(async () => {
      settleEscrow.reject(new Error('Invalid public key'))
    })
    await waitFor(() =>
      expect(
        screen.getAllByText(/^Escrow address unavailable/).length,
      ).toBeGreaterThan(0),
    )

    // the password is still typed: only the block disables the button now
    expect(screen.getByText('Approve')).toBeDisabled()
    fireEvent.click(screen.getByText('Approve'))
    await settlePage()

    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(sendPopupResponse).not.toHaveBeenCalled()
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
  })
})

// A payload that matches more than one kind — a refund type next to the
// secret hash of a new HTLC, every other field valid for both — used to be
// shown as a create (recap and generated-secret panel) and approvable,
// while the submit handler signed a refund of the existing HTLC output.
// The request is now classified once for the recap and the submit: it is
// ambiguous, shown as nothing else, and never signed.
describe('SignBitcoinTransaction — a payload of more than one kind', () => {
  const ambiguousRequest = () => ({
    ...MOCKS.refundHtlc,
    request: {
      ...MOCKS.refundHtlc.request,
      data: {
        txData: {
          JSONRepresentation: {
            ...MOCKS.createHtlc.request.data.txData.JSONRepresentation,
            ...MOCKS.refundHtlc.request.data.txData.JSONRepresentation,
          },
        },
      },
    },
  })

  it('shows neither kind, states why and never opens the password modal', async () => {
    stubClaimSigning()
    renderSignPage(ambiguousRequest())
    await settlePage()

    expect(boundaryMessage()).toBeNull()
    expect(screen.getByText('Ambiguous request')).toBeInTheDocument()
    expect(
      screen.getByText(/^Ambiguous request: this payload describes both/),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Create HTLC — fund an escrow'),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Refund HTLC')).not.toBeInTheDocument()
    expect(screen.queryByText('HTLC Secret Generated')).not.toBeInTheDocument()
    expect(screen.queryByText('Escrow address')).not.toBeInTheDocument()

    expect(approveButton()).toBeDisabled()
    fireEvent.click(approveButton())
    expect(screen.queryByText('Re-enter your Password')).not.toBeInTheDocument()
    // nothing of a create ran for it either
    expect(BTCTransaction.buildHTLCAndFundingAddress).not.toHaveBeenCalled()

    expect(screen.getByText('Decline')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Decline'))
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signTransaction_reject',
        error: 'Transaction rejected',
      }),
    )
    expect(Account.unlockAccount).not.toHaveBeenCalled()
  })

  // Each single-kind fixture still comes up as its own kind, approvable.
  it.each([
    ['createHtlc', 'Create HTLC — fund an escrow', 'HTLC Secret Generated'],
    ['spendHtlc', 'Claim HTLC', null],
    ['spendHtlc2', 'Claim HTLC', null],
    ['refundHtlc', 'Refund HTLC', null],
  ])(
    'still shows the %s fixture as its own kind',
    async (name, title, generated) => {
      renderSignPage(MOCKS[name])
      await settlePage()

      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.queryByText('Ambiguous request')).not.toBeInTheDocument()
      if (generated) {
        expect(screen.getByText(generated)).toBeInTheDocument()
      } else {
        expect(
          screen.queryByText('HTLC Secret Generated'),
        ).not.toBeInTheDocument()
      }
      expect(approveButton()).toBeEnabled()
    },
  )
})
