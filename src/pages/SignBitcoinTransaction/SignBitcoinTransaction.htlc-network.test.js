import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as bitcoin from 'bitcoinjs-lib'

import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { SettingsContext } from '@Contexts'
import { sendPopupResponse } from '@Browser'
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

// The pre-fix page imported the wasm package by DIRECTORY (bypassing the
// jest moduleNameMapper) — mock the resolved module so a regression back
// to that import still loads (see SignBitcoinTransaction.escrow-reset.test.js).
jest.mock('../../services/Crypto/Mintlayer/@mintlayerlib-js', () => ({
  __esModule: true,
  Network: Object.freeze({
    Mainnet: 0,
    0: 'Mainnet',
    Testnet: 1,
    1: 'Testnet',
  }),
}))

// The gate under test is WHICH networkType value reaches the HTLC claim /
// refund builders, not the crypto: the builders are stubbed and the call
// arguments are the assertion surface.
jest.mock('@Cryptos', () => ({
  __esModule: true,
  BTC: {},
  BTC_ADDRESS_TYPE_ENUM: {
    LEGACY: 'legacy',
    P2SH: 'p2sh',
    NATIVE_SEGWIT: 'nativeSegwit',
  },
  BTCTransaction: {
    HTLC_CLAIM_FEE_SATOSHIS: 154,
    HTLC_REFUND_FEE_SATOSHIS: 1000,
    toSatoshiBigInt: jest.requireActual(
      '../../services/Crypto/BTC/BTCTransaction',
    ).toSatoshiBigInt,
    findWalletKeyForRedeemScript: jest.fn(),
    buildHTLCAndFundingAddress: jest.fn(),
    calculateBtcTransactionFee: jest.fn(),
    buildTransaction: jest.fn(),
    buildHtlcClaimTx: jest.fn(),
    buildHtlcRefundTx: jest.fn(),
  },
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

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'htlc-network-account',
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

// The page parses the redeem script with real bitcoinjs code, so the
// fixture must be a genuine HTLC script (OP_IF / OP_HASH160 / hash ...).
const u8 = (bytes) => new Uint8Array(bytes)
const compileHtlc = (receiverPubkey, senderPubkey, lockBlocks = 100) =>
  Buffer.from(
    bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.opcodes.OP_HASH160,
      u8(Buffer.alloc(20, 2)),
      bitcoin.opcodes.OP_EQUALVERIFY,
      u8(receiverPubkey),
      bitcoin.opcodes.OP_ELSE,
      bitcoin.script.number.encode(lockBlocks),
      bitcoin.opcodes.OP_CHECKSEQUENCEVERIFY,
      bitcoin.opcodes.OP_DROP,
      u8(senderPubkey),
      bitcoin.opcodes.OP_ENDIF,
      bitcoin.opcodes.OP_CHECKSIG,
    ]),
  ).toString('hex')

const claimScriptHex = compileHtlc(
  Buffer.alloc(33, 3),
  Buffer.alloc(33, 9),
  100,
)
const refundScriptHex = compileHtlc(
  Buffer.alloc(33, 9),
  Buffer.alloc(33, 3),
  100,
)

// BIP173 mainnet P2WPKH test vector address — rejected by a testnet-pinned
// psbt, so the builders must receive 'mainnet' for mainnet wallets.
const MAINNET_DEST = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
const TESTNET_DEST = 'tb1qz5e8eqw4r960nz5xjcw0fvek3xfcyhn32gdksg'

const makeClaimRequestState = (network, to) => ({
  request: {
    requestId: 'claim-req-1',
    origin: 'https://dapp.example',
    network,
    data: {
      txData: {
        JSONRepresentation: {
          type: 'spendHtlc',
          utxo: { txid: 'f'.repeat(64), vout: 0, value: 2000 },
          redeemScriptHex: claimScriptHex,
          secret: 'ab'.repeat(32),
          to,
        },
      },
    },
  },
})

const makeRefundRequestState = (network, to) => ({
  request: {
    requestId: 'refund-req-1',
    origin: 'https://dapp.example',
    network,
    data: {
      txData: {
        JSONRepresentation: {
          type: 'refundHtlc',
          utxo: { txid: 'e'.repeat(64), vout: 0, value: 2500 },
          redeemScriptHex: refundScriptHex,
          to,
        },
      },
    },
  },
})

const SignPageHarness = ({ initialState, networkType }) => (
  <MemoryRouter
    initialEntries={[{ pathname: '/sign-btc', state: initialState }]}
  >
    <Routes>
      <Route
        path="/sign-btc"
        element={
          <SettingsContext.Provider value={{ networkType }}>
            <SignBitcoinTransactionPage />
          </SettingsContext.Provider>
        }
      />
    </Routes>
  </MemoryRouter>
)

const renderSignPage = (initialState, networkType) =>
  render(
    <SignPageHarness
      initialState={initialState}
      networkType={networkType}
    />,
  )

// The recap 'Network' row renders as <dt>label</dt><dd>value</dd>.
const recapNetworkValue = () => {
  const label = screen.getByText('Network')
  return label.parentElement.querySelector('dd')?.textContent
}

const approveThroughModal = async (expectedMethod) => {
  fireEvent.click(screen.getByText('Approve and return to page'))
  expect(screen.getByText('Re-enter your Password')).toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
    target: { value: 'password123' },
  })
  fireEvent.click(screen.getByText('Approve'))
  await waitFor(() =>
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({ method: expectedMethod }),
    ),
  )
}

describe('SignBitcoinTransaction — HTLC claim/refund network binding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    errorSpy.mockClear()
    Account.unlockAccount.mockResolvedValue({
      btcPrivateKeys: {
        btcAddressData: {
          btcReceivingAddresses: [
            { address: MAINNET_DEST },
            { address: TESTNET_DEST },
          ],
          btcChangeAddresses: [],
        },
      },
    })
    // No pre-saved secret: the claim falls back to the request's revealed
    // secret (the manual-input path stays out of scope here).
    Account.unlockHtlsSecret.mockRejectedValue(new Error('no saved secret'))
    BTCTransaction.findWalletKeyForRedeemScript.mockReturnValue({
      wif: 'mainnetwif1111',
    })
    BTCTransaction.buildHtlcClaimTx.mockResolvedValue('deadbeef')
    BTCTransaction.buildHtlcRefundTx.mockResolvedValue('cafebabe')
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  test('mainnet claim passes the wallet networkType string (not the Mintlayer enum) to the claim builder', async () => {
    renderSignPage(makeClaimRequestState('mainnet', MAINNET_DEST), 'mainnet')

    // Recap reflects the network the tx will be built with.
    expect(recapNetworkValue()).toBe('mainnet')

    await approveThroughModal('signTransaction_approve')

    expect(BTCTransaction.buildHtlcClaimTx).toHaveBeenCalledTimes(1)
    const callArgs = BTCTransaction.buildHtlcClaimTx.mock.calls[0][0]
    expect(callArgs.networkType).toBe('mainnet')
    // Regression: the old code passed the enum under `network`, which the
    // builder silently ignored (networkType defaulted to 'testnet').
    expect(callArgs.network).toBeUndefined()
    expect(callArgs.toAddress).toBe(MAINNET_DEST)
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signTransaction_approve',
        requestId: 'claim-req-1',
        result: { signedTxHex: 'deadbeef' },
      }),
    )
  })

  test('mainnet refund passes the wallet networkType string to the refund builder', async () => {
    renderSignPage(makeRefundRequestState('mainnet', MAINNET_DEST), 'mainnet')

    expect(recapNetworkValue()).toBe('mainnet')

    await approveThroughModal('signTransaction_approve')

    expect(BTCTransaction.buildHtlcRefundTx).toHaveBeenCalledTimes(1)
    const callArgs = BTCTransaction.buildHtlcRefundTx.mock.calls[0][0]
    expect(callArgs.networkType).toBe('mainnet')
    expect(callArgs.network).toBeUndefined()
    expect(callArgs.toAddress).toBe(MAINNET_DEST)
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signTransaction_approve',
        requestId: 'refund-req-1',
        result: { signedTxHex: 'cafebabe' },
      }),
    )
  })

  test('testnet claim is unchanged: the builder receives testnet', async () => {
    renderSignPage(makeClaimRequestState('testnet', TESTNET_DEST), 'testnet')

    expect(recapNetworkValue()).toBe('testnet')

    await approveThroughModal('signTransaction_approve')

    const callArgs = BTCTransaction.buildHtlcClaimTx.mock.calls[0][0]
    expect(callArgs.networkType).toBe('testnet')
    expect(callArgs.network).toBeUndefined()
    expect(callArgs.toAddress).toBe(TESTNET_DEST)
  })

  test('a request granted on a different network never reaches the builders (fail-closed guard)', async () => {
    renderSignPage(makeClaimRequestState('testnet', TESTNET_DEST), 'mainnet')

    await approveThroughModal('signTransaction_reject')

    expect(BTCTransaction.buildHtlcClaimTx).not.toHaveBeenCalled()
    expect(sendPopupResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'signTransaction_reject',
        error: expect.objectContaining({ code: 'WRONG_NETWORK' }),
      }),
    )
  })
})
