import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

import { Electrum } from '@APIs'
import { Account } from '@Entities'
import { BTCTransaction } from '@Cryptos'
import { BitcoinContext } from '@Contexts'
import ConfirmBtcTransactionPage from './ConfirmBtcTransaction'

// Keep the output readable: swallow React's act()/render noise.
const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

jest.mock('@APIs', () => ({
  __esModule: true,
  Electrum: {
    broadcastTransaction: jest.fn(),
  },
}))

jest.mock('@Entities', () => ({
  __esModule: true,
  Account: {
    hasPasskey: jest.fn(),
    unlockAccount: jest.fn(),
    getAccount: jest.fn(),
    getPasswordWithPasskey: jest.fn(),
  },
}))

// The gate under test is WHICH utxo set reaches the broadcast path, not the
// crypto itself: both BTCTransaction sinks are stubbed and their arguments
// asserted — a rebuild from the live context set is directly observable as a
// mismatching `utxos` argument.
jest.mock('@Cryptos', () => ({
  __esModule: true,
  BTC: {},
  BTC_ADDRESS_TYPE_ENUM: {
    LEGACY: 'legacy',
    P2SH: 'p2sh',
    NATIVE_SEGWIT: 'nativeSegwit',
  },
  BTCTransaction: {
    calculateBtcTransactionFee: jest.fn(),
    buildTransaction: jest.fn(),
  },
}))

// Real page, real modal, fake wallet state.
jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      accountID: 'btc-confirm-test-account',
      addresses: {
        btcAddresses: { btcReceivingAddresses: [], btcChangeAddresses: [] },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
    BitcoinContext: makeCtx({
      btcUtxos: [],
      unusedAddresses: { changeAddress: 'tb1qchangeaddress' },
      fetchAllData: jest.fn(),
    }),
    TransactionContext: makeCtx({}),
    MintlayerContext: makeCtx({}),
    ExchangeRatesContext: makeCtx({}),
  }
})

// Approval-time snapshot: the UTXO set as it was when the displayed fee was
// quoted on the send form.
const approvedUtxos = [
  { txid: 'aa'.repeat(32), vout: 0, value: 45000, address: 'tb1qinputone' },
  { txid: 'bb'.repeat(32), vout: 0, value: 40000, address: 'tb1qinputtwo' },
]
// Live set: a routine 2-minute background poll picked up an incoming payment
// while the user sat on the confirm page entering the password.
const liveUtxos = [
  ...approvedUtxos,
  { txid: 'cc'.repeat(32), vout: 0, value: 120000, address: 'tb1qnewutxo' },
]

const APPROVED_FEE_SAT = 7480
const BUILT_TX_HEX = 'aabbccdd'

const routeState = {
  address: 'tb1qrecipient',
  amountInCrypto: '0,0007',
  amountInFiat: '0,00',
  fee: 20,
  totalFeeFiat: '0,00',
  totalFeeCrypto: '0.0000748',
  totalFeeSatoshi: APPROVED_FEE_SAT,
  approvedUtxos,
  btcWalletType: 'nativeSegwit',
  walletType: { name: 'Bitcoin', ticker: 'BTC', chain: 'bitcoin' },
  transactionAmount: 0.0007,
}

const makeBitcoinContext = (btcUtxos) => ({
  btcUtxos,
  unusedAddresses: { changeAddress: 'tb1qchangeaddress' },
  fetchAllData: jest.fn(),
})

const renderConfirmPage = (state, bitcoinContextValue) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/confirm', state }]}>
      <Routes>
        <Route
          path="/confirm"
          element={
            <BitcoinContext.Provider value={bitcoinContextValue}>
              <ConfirmBtcTransactionPage />
            </BitcoinContext.Provider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )

// Walk the real approval UI: Confirm button → password modal → Submit.
const approveAndSubmit = async () => {
  fireEvent.click(screen.getByText('Confirm'))
  const passwordInput = await screen.findByPlaceholderText(
    'Enter your password',
  )
  fireEvent.change(passwordInput, { target: { value: 'password' } })
  await act(async () => {
    fireEvent.click(screen.getByText('Submit'))
  })
}

describe('ConfirmBtcTransaction invariant: broadcast equals approval', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Account.hasPasskey.mockResolvedValue(false)
    Account.unlockAccount.mockResolvedValue({
      btcPrivateKeys: { btcAddressData: {}, btcHDWallet: {} },
    })
    BTCTransaction.calculateBtcTransactionFee.mockResolvedValue(
      APPROVED_FEE_SAT,
    )
    BTCTransaction.buildTransaction.mockResolvedValue([{}, BUILT_TX_HEX])
    Electrum.broadcastTransaction.mockResolvedValue('{"txid":"confirmed-txid"}')
  })

  afterAll(() => {
    errorSpy.mockRestore()
  })

  test('broadcasts the approved snapshot even though the live UTXO set changed', async () => {
    renderConfirmPage(routeState, makeBitcoinContext(liveUtxos))

    await approveAndSubmit()

    // The signing build runs against the frozen approval snapshot — the
    // newly polled UTXO (which would change the coin selection and fee)
    // never reaches the broadcast path.
    expect(BTCTransaction.buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ utxos: approvedUtxos }),
    )
    expect(Electrum.broadcastTransaction).toHaveBeenCalledWith(BUILT_TX_HEX)
    expect(
      await screen.findByText(/Your transaction was sent/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/confirmed-txid/)).toBeInTheDocument()
  })

  test('broadcasts byte-identically when the live set still matches the snapshot', async () => {
    renderConfirmPage(routeState, makeBitcoinContext(approvedUtxos))

    await approveAndSubmit()

    expect(BTCTransaction.buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ utxos: approvedUtxos }),
    )
    expect(Electrum.broadcastTransaction).toHaveBeenCalledTimes(1)
    expect(Electrum.broadcastTransaction).toHaveBeenCalledWith(BUILT_TX_HEX)
    expect(
      await screen.findByText(/Your transaction was sent/i),
    ).toBeInTheDocument()
  })

  test('aborts without broadcasting when the re-derived fee diverges from the approved fee', async () => {
    BTCTransaction.calculateBtcTransactionFee.mockResolvedValue(
      APPROVED_FEE_SAT + 100,
    )
    renderConfirmPage(routeState, makeBitcoinContext(approvedUtxos))

    await approveAndSubmit()

    expect(
      await screen.findByText(/Fee changed since approval/i),
    ).toBeInTheDocument()
    // Fail closed: no keys unlocked, nothing signed, nothing broadcast.
    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(BTCTransaction.buildTransaction).not.toHaveBeenCalled()
    expect(Electrum.broadcastTransaction).not.toHaveBeenCalled()
  })

  test('fails closed when route state carries no approved snapshot', async () => {
    const {
      approvedUtxos: _a,
      totalFeeSatoshi: _t,
      btcWalletType: _w,
      ...legacyState
    } = routeState
    renderConfirmPage(legacyState, makeBitcoinContext(approvedUtxos))

    await approveAndSubmit()

    expect(
      await screen.findByText(/Approved transaction data is missing/i),
    ).toBeInTheDocument()
    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(Electrum.broadcastTransaction).not.toHaveBeenCalled()
  })

  test('fails closed when the frozen trio exists but the recipient or fee rate is missing', async () => {
    // Without the recipient, buildTransaction would silently fold the
    // missing recipient output into the wallet change address.
    const { address: _address, ...noRecipient } = routeState
    const first = renderConfirmPage(
      noRecipient,
      makeBitcoinContext(approvedUtxos),
    )

    await approveAndSubmit()

    expect(
      await screen.findByText(/Approved transaction data is missing/i),
    ).toBeInTheDocument()
    expect(Account.unlockAccount).not.toHaveBeenCalled()
    expect(BTCTransaction.buildTransaction).not.toHaveBeenCalled()
    expect(Electrum.broadcastTransaction).not.toHaveBeenCalled()
    first.unmount()

    // Without the fee rate the re-quote cannot reproduce the approved fee.
    const { fee: _fee, ...noFeeRate } = routeState
    renderConfirmPage(noFeeRate, makeBitcoinContext(approvedUtxos))

    await approveAndSubmit()

    expect(
      await screen.findByText(/Approved transaction data is missing/i),
    ).toBeInTheDocument()
    expect(Electrum.broadcastTransaction).not.toHaveBeenCalled()
  })

  test('re-derives the fee from the same snapshot, targets and rate as the send form', async () => {
    renderConfirmPage(routeState, makeBitcoinContext(liveUtxos))

    await approveAndSubmit()

    expect(BTCTransaction.calculateBtcTransactionFee).toHaveBeenCalledWith({
      to: routeState.address,
      amount: 70000,
      utxos: approvedUtxos,
      feeRate: routeState.fee,
      walletType: routeState.btcWalletType,
    })
    expect(BTCTransaction.buildTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        to: routeState.address,
        amount: 70000,
        feeRate: routeState.fee,
        walletType: routeState.btcWalletType,
      }),
    )
  })
})
