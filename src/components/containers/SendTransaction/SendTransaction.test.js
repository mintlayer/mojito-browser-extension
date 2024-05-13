import { render, screen, act, fireEvent } from '@testing-library/react'

import SendTransaction from './SendTransaction'

import {
  AccountProvider, NetworkContext,
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
      <AccountProvider>
        <SettingsProvider>
          <TransactionProvider>
            <NetworkContext.Provider value={{}}>
              <SendTransaction
                transactionData={TRANSACTIONDATASAMPLE}
                setFormValidity={() => {}}
                calculateTotalFee={() => {}}
                walletType={{ name: 'Mintlayer' }}
              />
            </NetworkContext.Provider>
            ,
          </TransactionProvider>
        </SettingsProvider>
      </AccountProvider>,
    )
  })

  const btn = screen.getByText('Send')

  act(() => {
    fireEvent.click(btn)
  })
})
