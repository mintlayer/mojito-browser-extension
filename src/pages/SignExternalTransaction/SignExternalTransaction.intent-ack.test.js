import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { sendPopupResponse } from '@Browser'
import { SignTransaction as SignTxHelpers } from '@Helpers'
import { Account } from '@Entities'

// Keep the output readable: swallow React's error logging noise (this also
// covers the act() warnings fired by async signing-state updates).
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
    hasPasskey: jest.fn(),
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
      accountID: 'intent-ack-test-account',
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

// The gate under test is the AUTHORIZATION to reach the signing sinks, not
// the crypto itself: every helper stays real (amount reconciliation, type
// flags, summary rendering) and only the three signing sinks are stubbed —
// a bypass is then directly observable as "sink never called". Mocking the
// DEEP module (not the @Helpers barrel) keeps the barrel's own circular
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

// A reconciliation-consistent request carrying a dApp-controlled intent —
// the bridge flow. The amounts agree, so the ONLY thing that may gate
// approval is the explicit intent acknowledgment.
const intentRequest = {
  request: {
    origin: 'https://bridge.example',
    requestId: 'intent-ack-1',
    network: 'testnet',
    data: {
      chain: 'mintlayer',
      txData: {
        intent: '0xdeadbeefdeadbeefdeadbeefdeadbeef',
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
              value: {
                type: 'Coin',
                amount: { atoms: '1000000000000', decimal: '10' },
              },
            },
          ],
        },
      },
    },
  },
}

// Same transaction WITHOUT the dApp intent — the plain transfer flow.
// Distinct origin/requestId so the approve response is assertion-exact.
const intentFreeRequest = (() => {
  const request = JSON.parse(JSON.stringify(intentRequest))
  delete request.request.data.txData.intent
  request.request.origin = 'https://app.example'
  request.request.requestId = 'no-intent-1'
  return request
})()

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

describe('SignTransactionPage — intent acknowledgment gate on both approval paths', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Account.hasPasskey.mockResolvedValue(false)
    Account.unlockAccount.mockResolvedValue({
      mlPrivKeys: { mlTestnetPrivateKey: 'test-private-key' },
    })
    Account.getPasswordWithPasskey.mockResolvedValue('passkey-secret')
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  // SECURITY REGRESSION: the password-path Approve button only checked
  // `isSigning || !password`, so a user approving via password could sign
  // dApp-controlled intent bytes without ever acknowledging them.
  it('disables the password Approve and never reaches the signer while the intent is unacknowledged', async () => {
    renderSignPage(JSON.parse(JSON.stringify(intentRequest)))

    // open the approval modal — password path (wallet has no passkey)
    fireEvent.click(screen.getByText('Approve and return to page'))
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()

    // a typed password satisfies the legacy password-only guard: before the
    // fix nothing else stood between this click and the signer
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })

    const approve = screen.getByText('Approve')
    expect(approve).toBeDisabled()

    // any submit attempt must be a no-op: no signing sink, no popup response
    fireEvent.click(approve)
    await waitFor(() =>
      expect(
        SignTxHelpers.getTransactionBINrepresentation,
      ).not.toHaveBeenCalled(),
    )
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })

  // SECURITY REGRESSION: handleModalSubmit never re-checked acknowledgment —
  // with the checkbox ticked the approval must proceed normally, proving the
  // gate blocks the unacknowledged case, not the bridge flow itself.
  it('proceeds to sign once the intent acknowledgment is given (password path)', async () => {
    renderSignPage(JSON.parse(JSON.stringify(intentRequest)))

    fireEvent.click(screen.getByText('Approve and return to page'))
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })

    // the summary shows the full intent bytes; acknowledging them is what
    // unlocks approval
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('Approve')).toBeEnabled()

    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() =>
      expect(sendPopupResponse).toHaveBeenCalledWith({
        method: 'signTransaction_approve',
        requestId: 'intent-ack-1',
        origin: 'https://bridge.example',
        result: { transactionHex: 'aabbccdd', intentEncode: 'eeff0011' },
      }),
    )
  })

  // The passkey path was already button-gated; both paths funnel through
  // handleModalSubmit, whose early return must keep the passkey flow from
  // reaching the signer without acknowledgment too.
  it('gates the passkey path identically: disabled and a no-op until acknowledged', async () => {
    Account.hasPasskey.mockResolvedValue(true)
    renderSignPage(JSON.parse(JSON.stringify(intentRequest)))

    fireEvent.click(screen.getByText('Approve and return to page'))
    // the passkey availability resolves asynchronously — the modal first
    // renders the password branch and switches once hasPasskey settles
    const confirmWithPasskey = await screen.findByText('Confirm with passkey')
    expect(confirmWithPasskey).toBeDisabled()

    fireEvent.click(confirmWithPasskey)
    await waitFor(() =>
      expect(
        SignTxHelpers.getTransactionBINrepresentation,
      ).not.toHaveBeenCalled(),
    )
    expect(sendPopupResponse).not.toHaveBeenCalled()
  })

  it('proceeds to sign once the intent acknowledgment is given (passkey path)', async () => {
    Account.hasPasskey.mockResolvedValue(true)
    renderSignPage(JSON.parse(JSON.stringify(intentRequest)))

    fireEvent.click(screen.getByText('Approve and return to page'))
    const confirmWithPasskey = await screen.findByText('Confirm with passkey')
    fireEvent.click(screen.getByRole('checkbox'))
    expect(confirmWithPasskey).toBeEnabled()

    fireEvent.click(screen.getByText('Confirm with passkey'))

    await waitFor(() =>
      expect(sendPopupResponse).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'signTransaction_approve' }),
      ),
    )
  })

  // NON-INTENT FLOW: a plain transaction must approve end-to-end with no
  // acknowledgment UI at all — the gate exists only for opaque intent bytes,
  // and ordinary approval must still reach the signer untouched.
  it('approves an intent-free transaction with no acknowledgment UI', async () => {
    renderSignPage(JSON.parse(JSON.stringify(intentFreeRequest)))

    fireEvent.click(screen.getByText('Approve and return to page'))
    expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()

    // no intent → no acknowledgment checkbox anywhere in the modal
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'wallet-password' },
    })
    expect(screen.getByText('Approve')).toBeEnabled()

    fireEvent.click(screen.getByText('Approve'))

    await waitFor(() =>
      expect(sendPopupResponse).toHaveBeenCalledWith({
        method: 'signTransaction_approve',
        requestId: 'no-intent-1',
        origin: 'https://app.example',
        // intent-free approval signs the transaction only — no intentEncode
        result: 'aabbccdd',
      }),
    )
    // and the intent-signing sink was never engaged
    expect(SignTxHelpers.getTransactionIntent).not.toHaveBeenCalled()
  })
})
