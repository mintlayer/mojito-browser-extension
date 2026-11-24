import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router'

import SendBtcTransaction from './SendBtcTransaction'
import SendMlTransaction from './SendMlTransaction'

import {
  AccountProvider,
  MintlayerContext,
  SettingsProvider,
  TransactionProvider,
} from '@Contexts'

const TRANSACTIONDATASAMPLE = {
  fiatName: 'USD',
  tokenName: 'BTC',
  exchangeRate: 22343.23,
  maxValueInToken: 450,
}

const renderSendTransaction = (
  onSendTransaction,
  confirmElement = <div>Confirm transaction</div>,
) =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <AccountProvider>
              <SettingsProvider>
                <TransactionProvider>
                  <MintlayerContext.Provider value={{}}>
                    <SendBtcTransaction
                      transactionData={TRANSACTIONDATASAMPLE}
                      setFormValidity={() => {}}
                      calculateTotalFee={() => {}}
                      onSendTransaction={onSendTransaction}
                      isFormValid
                      walletType={{ name: 'Mintlayer' }}
                    />
                  </MintlayerContext.Provider>
                </TransactionProvider>
              </SettingsProvider>
            </AccountProvider>
          }
        />
        <Route
          path="confirm"
          element={confirmElement}
        />
      </Routes>
    </MemoryRouter>,
  )

test('Send Transaction', async () => {
  const onSendTransaction = jest.fn().mockResolvedValue({
    totalFeeFiat: 1,
    totalFeeCrypto: 2,
  })

  await act(async () => {
    renderSendTransaction(onSendTransaction)
  })

  const btn = screen.getByText('Send')
  expect(btn).toBeEnabled()

  await act(async () => {
    fireEvent.click(btn)
  })

  expect(onSendTransaction).toHaveBeenCalledTimes(1)

  // navigation to the confirmation route happens once fees are returned
  expect(await screen.findByText('Confirm transaction')).toBeInTheDocument()
})

test('does not navigate when onSendTransaction resolves without fee data', async () => {
  const onSendTransaction = jest.fn().mockResolvedValue()

  await act(async () => {
    renderSendTransaction(onSendTransaction)
  })

  const btn = screen.getByText('Send')
  expect(btn).toBeEnabled()

  await act(async () => {
    fireEvent.click(btn)
  })

  expect(onSendTransaction).toHaveBeenCalledTimes(1)

  // no fee data means no navigation: the form stays mounted on the same route
  expect(screen.getByText('Send')).toBeInTheDocument()
  expect(screen.queryByText('Confirm transaction')).not.toBeInTheDocument()
})

// The confirm page must broadcast what the user approved, so the approval
// figures travel together with the exact UTXO snapshot the fee was quoted
// from — the route state carries them as one frozen record.
test('passes the approved fee snapshot through the confirmation route state', async () => {
  const approvedUtxos = [{ txid: 'aa'.repeat(32), vout: 0, value: 45000 }]
  let confirmRouteState
  const StateCapture = () => {
    const { state } = useLocation()
    confirmRouteState = state
    return <div>Confirm transaction</div>
  }
  const onSendTransaction = jest.fn().mockResolvedValue({
    totalFeeFiat: 1,
    totalFeeCrypto: 2,
    totalFeeSatoshi: 7480,
    approvedUtxos,
    btcWalletType: 'nativeSegwit',
  })

  await act(async () => {
    renderSendTransaction(onSendTransaction, <StateCapture />)
  })

  const btn = screen.getByText('Send')

  await act(async () => {
    fireEvent.click(btn)
  })

  expect(await screen.findByText('Confirm transaction')).toBeInTheDocument()
  expect(confirmRouteState).toMatchObject({
    totalFeeSatoshi: 7480,
    approvedUtxos,
    btcWalletType: 'nativeSegwit',
  })
})

// ML send form: the network fee is paid in ML coins even when the transfer
// spends a token balance, so the amount and the fee must each be checked
// against their own balance — never summed across units.
const ML_TRANSACTION_DEFAULTS = {
  totalFeeCrypto: 0,
  feeLoading: false,
  feeError: '',
  transactionData: { fiatName: 'USD', tokenName: 'TKN' },
  exchangeRate: 1,
  maxValueInToken: 1000000,
  mlCoinBalance: 5,
  isFormValid: true,
  walletType: {
    name: 'TKN',
    ticker: 'TKN',
    chain: 'mintlayer',
    tokenId: '0xabc123',
  },
}

const renderSendMlTransaction = (props = {}) => {
  const setFormValidity = jest.fn()

  const tree = (currentProps) => (
    <MemoryRouter initialEntries={['/']}>
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <MintlayerContext.Provider value={{}}>
              <SendMlTransaction
                {...ML_TRANSACTION_DEFAULTS}
                {...currentProps}
                setFormValidity={setFormValidity}
                onSendTransaction={() => {}}
                confirmTransaction={() => Promise.resolve()}
              />
            </MintlayerContext.Provider>
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>
    </MemoryRouter>
  )

  const view = render(tree(props))
  const rerenderWith = async (nextProps) => {
    await act(async () => {
      view.rerender(tree({ ...props, ...nextProps }))
    })
  }
  const fillField = async (id, value) => {
    await act(async () => {
      fireEvent.change(view.container.querySelector(`#${id}`), {
        target: { value },
      })
    })
  }
  const fillForm = async (amount) => {
    await fillField('address', 'mtc1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka')
    await fillField('amount', amount)
  }

  return { setFormValidity, rerenderWith, fillForm }
}

test('token send with sufficient token and ML balances proceeds once the fee arrives', async () => {
  const { setFormValidity, rerenderWith, fillForm } = renderSendMlTransaction()

  // Token amount 1,000,000 is above the ML balance (5): valid, because the
  // fee is not paid from the token balance.
  await fillForm('1000000')
  expect(setFormValidity).toHaveBeenLastCalledWith(true)

  // The fee is quoted after the amount is typed. Summing amount + fee and
  // comparing against the token balance used to block this valid send.
  await rerenderWith({ totalFeeCrypto: 0.1 })
  expect(setFormValidity).toHaveBeenLastCalledWith(true)
})

test('token send above the token balance is blocked with a token-balance error', async () => {
  const { setFormValidity, rerenderWith, fillForm } = renderSendMlTransaction()

  await fillForm('1000000')
  expect(setFormValidity).toHaveBeenLastCalledWith(true)

  // A balance refresh drops the token balance below the typed amount.
  await rerenderWith({ maxValueInToken: 999999 })

  expect(setFormValidity).toHaveBeenLastCalledWith(false)
  expect(screen.getByText('Insufficient token balance')).toBeInTheDocument()
})

test('token send with a fee above the ML coin balance is blocked with a fee error', async () => {
  const { setFormValidity, fillForm } = renderSendMlTransaction({
    totalFeeCrypto: 6,
  })

  // Token amount is fine, but the 6 ML fee exceeds the 5 ML balance.
  await fillForm('100')

  expect(setFormValidity).toHaveBeenLastCalledWith(false)
  expect(
    screen.getByText('Insufficient ML balance for the transaction fee'),
  ).toBeInTheDocument()
})

test('coin send still checks amount plus fee against the ML coin balance', async () => {
  const { setFormValidity, rerenderWith, fillForm } = renderSendMlTransaction({
    transactionData: { fiatName: 'USD', tokenName: 'ML' },
    maxValueInToken: 10,
    totalFeeCrypto: 1,
    walletType: {
      name: 'Mintlayer',
      ticker: 'ML',
      chain: 'mintlayer',
      tokenId: null,
    },
  })

  // 9 + 1 = 10 stays within the 10 ML balance: allowed.
  await fillForm('9')
  expect(setFormValidity).toHaveBeenLastCalledWith(true)

  // 9 + 1.1 = 10.1 exceeds the 10 ML balance: blocked.
  await rerenderWith({ totalFeeCrypto: 1.1 })

  expect(setFormValidity).toHaveBeenLastCalledWith(false)
  expect(screen.getByText('Insufficient funds')).toBeInTheDocument()
})

test('token amount field no longer contradicts the gate near the token balance', async () => {
  const { setFormValidity, fillForm } = renderSendMlTransaction({
    totalFeeCrypto: 0.1,
  })

  // 1,000,000 TKN with a 0.1 ML fee: the amount field must not show its
  // fee-subtracted wallet-balance error for a per-unit valid token send.
  await fillForm('1000000')

  expect(setFormValidity).toHaveBeenLastCalledWith(true)
  expect(
    screen.queryByText('Amount set is bigger than this wallet balance.'),
  ).not.toBeInTheDocument()
})

test('token fee check waits for the first ML balance fetch', async () => {
  const { setFormValidity, rerenderWith, fillForm } = renderSendMlTransaction({
    mlCoinBalance: 0,
    mlBalanceLoading: true,
    totalFeeCrypto: 0.1,
  })

  // Balances not fetched yet (0 default): no false fee error.
  await fillForm('100')
  expect(setFormValidity).toHaveBeenLastCalledWith(true)
  expect(
    screen.queryByText('Insufficient ML balance for the transaction fee'),
  ).not.toBeInTheDocument()

  // Once the fetch settles with an insufficient balance: blocked.
  await rerenderWith({ mlBalanceLoading: false, mlCoinBalance: 0.05 })

  expect(setFormValidity).toHaveBeenLastCalledWith(false)
  expect(
    screen.getByText('Insufficient ML balance for the transaction fee'),
  ).toBeInTheDocument()
})
