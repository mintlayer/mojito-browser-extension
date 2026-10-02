import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'

import SendBtcTransaction from './SendBtcTransaction'

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

const renderSendTransaction = (onSendTransaction) =>
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
          element={<div>Confirm transaction</div>}
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
