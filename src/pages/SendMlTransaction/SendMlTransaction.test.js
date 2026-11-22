import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

// The ML coin balance lives on MintlayerContext; the token balance comes
// from useMlWalletInfo(coinType). The page must wire the former into the
// container's mlCoinBalance even on a token route.
const ML_COIN_BALANCE = 5
const TOKEN_BALANCE = 1000000

let containerProps = null

jest.mock('@ContainerComponents', () => ({
  __esModule: true,
  SendMlTransaction: (props) => {
    containerProps = props
    return null
  },
}))
jest.mock('@ComposedComponents', () => ({
  __esModule: true,
  SendPageHeader: () => null,
}))
jest.mock('@LayoutComponents', () => ({
  __esModule: true,
  VerticalGroup: ({ children }) => children,
}))
jest.mock('@BasicComponents', () => ({
  __esModule: true,
  PageWrapper: ({ children }) => children,
}))
jest.mock('@Hooks', () => ({
  __esModule: true,
  useExchangeRates: () => ({ exchangeRate: 100 }),
  useMlWalletInfo: (token) => ({
    balance: token === 'Mintlayer' ? ML_COIN_BALANCE : TOKEN_BALANCE,
    tokenBalances: {},
    fetchingBalances: false,
  }),
}))
jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({ accountID: 'account-1' }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
    MintlayerContext: makeCtx({
      client: {},
      utxos: [],
      balance: ML_COIN_BALANCE,
      fetchingBalances: false,
    }),
  }
})

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const SendMlTransactionPage = require('./SendMlTransaction').default

const renderAtTokenRoute = () =>
  render(
    <MemoryRouter
      initialEntries={['/wallet/tmltk1qz2c7d9a4hm3/send-ml-transaction']}
    >
      <Routes>
        <Route
          path="/wallet/:coinType/send-ml-transaction"
          element={<SendMlTransactionPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

describe('SendMlTransactionPage', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it('wires the MintlayerContext coin balance — not the token balance — into mlCoinBalance', () => {
    renderAtTokenRoute()

    expect(containerProps).not.toBeNull()
    // The fee gate must compare against the ML coin balance (5), never the
    // token balance (1,000,000) that useMlWalletInfo returns for the route.
    expect(containerProps.mlCoinBalance).toBe(ML_COIN_BALANCE)
    expect(containerProps.maxValueInToken).toBe(TOKEN_BALANCE)
    // The fetching state travels with the balance for the loading gate.
    expect(containerProps.mlBalanceLoading).toBe(false)
  })
})
