import React from 'react'
import { MemoryRouter } from 'react-router'
import { render, screen, fireEvent } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

jest.mock('@Hooks', () => ({
  __esModule: true,
  useBtcWalletInfo: () => ({
    balance: '0',
    fetchingBalances: false,
    btcApiAvailable: true,
    transactions: [],
  }),
  useMlWalletInfo: () => ({
    balance: '100',
    tokenBalances: {},
    fetchingBalances: false,
    fetchingTokens: false,
  }),
  useExchangeRates: () => ({ exchangeRate: 1 }),
  useOneDayAgoExchangeRates: () => ({ yesterdayExchangeRate: 1 }),
  useTokenPrices: () => ({ tokenPrices: {} }),
}))

jest.mock('src/hooks/UseOneDayAgoHist/useOneDayAgoHist', () => ({
  __esModule: true,
  default: () => ({ historyRates: [] }),
}))

jest.mock('@APIs', () => ({
  __esModule: true,
  PriceFeed: { toFeedTicker: () => null },
  // NFT images resolve through the gateway resolver — keep tests offline.
  Mintlayer: { resolveNftImage: jest.fn(async () => null) },
}))

jest.mock('@ComposedComponents', () => ({
  __esModule: true,
  PopUp: ({ children }) => <div>{children}</div>,
  AddWallet: () => null,
  TxRow: () => null,
  AssetRow: () => null,
}))

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      addresses: [],
      accountName: 'Test',
      accountID: 'acc1',
    }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
    BitcoinContext: makeCtx({}),
    TransactionContext: makeCtx({}),
    MintlayerContext: makeCtx({
      transactions: [],
      tokenMap: {},
      nftData: [
        {
          token_id: 'tmltk1nft1',
          data: {
            name: { string: 'Dashboard NFT' },
            ticker: { string: 'DNFT' },
          },
        },
      ],
      fetchingNft: false,
    }),
  }
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const DashboardPage = require('./Dashboard').default

describe('Dashboard — NFTs tab', () => {
  afterAll(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('shows the honest empty state while the Tokens tab is active', () => {
    renderPage()

    // NFT content is not rendered until the NFTs tab is selected
    expect(screen.queryByText('Dashboard NFT')).not.toBeInTheDocument()
    expect(screen.getByText('Tokens')).toBeInTheDocument()
  })

  it('renders real NFT tiles from the provider data', () => {
    renderPage()

    fireEvent.click(screen.getByText('NFTs'))

    expect(screen.getByTestId('nft-tile')).toBeInTheDocument()
    expect(screen.getByText('Dashboard NFT')).toBeInTheDocument()
    expect(screen.getByText('DNFT')).toBeInTheDocument()
    expect(
      screen.queryByText(/No NFTs in this wallet/i),
    ).not.toBeInTheDocument()
  })

  it('links to the full NFT page from the NFTs tab', () => {
    renderPage()

    expect(screen.queryByTestId('nft-see-all')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('NFTs'))

    expect(screen.getByTestId('nft-see-all')).toBeInTheDocument()
  })
})
