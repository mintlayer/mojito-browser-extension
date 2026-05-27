import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

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

test('Send Transaction', async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <AccountProvider>
          <SettingsProvider>
            <TransactionProvider>
              <MintlayerContext.Provider value={{}}>
                <SendBtcTransaction
                  transactionData={TRANSACTIONDATASAMPLE}
                  setFormValidity={() => {}}
                  calculateTotalFee={() => {}}
                  walletType={{ name: 'Mintlayer' }}
                />
              </MintlayerContext.Provider>
            </TransactionProvider>
          </SettingsProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  })

  const btn = screen.getByText('Send')

  act(() => {
    fireEvent.click(btn)
  })
})
