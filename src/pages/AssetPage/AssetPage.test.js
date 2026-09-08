import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { render } from '@testing-library/react'

const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

const TOKEN_ID = 'tmltk1q2c7d9a4hm3'

jest.mock('@Hooks', () => {
  const mockTokenBalances = {
    tmltk1q2c7d9a4hm3: {
      balance: 10,
      token_info: {
        token_id: 'tmltk1q2c7d9a4hm3',
        token_ticker: { string: 'CBEAT', hex: '0x4342454154' },
        number_of_decimals: 2,
      },
    },
  }
  return {
    __esModule: true,
    useExchangeRates: () => ({ exchangeRate: 100 }),
    useOneDayAgoHist: () => ({ historyRates: { 0: 100, 1: 101 } }),
    useBtcWalletInfo: () => ({
      balance: '0.5',
      transactions: [
        { direction: 'in', date: 1700000000, value: 1000, txid: 'h1' },
      ],
    }),
    useMlWalletInfo: (_addresses, token) => {
      const nativecoins = ['Mintlayer', 'Bitcoin']
      if (token && !nativecoins.includes(token)) {
        return {
          balance: 10,
          transactions: [
            {
              direction: 'out',
              date: 1700000002,
              value: 2,
              txid: 'h4',
              token_id: token,
            },
          ],
          tokenBalances: mockTokenBalances,
          unusedAddresses: { receive: 'mtc1qtest' },
        }
      }
      return {
        balance: '120',
        transactions: [
          { direction: 'out', date: 1700000000, value: 5, txid: 'h2' },
          { direction: 'in', date: 1700000001, value: 1, txid: 'h3' },
        ],
        tokenBalances: mockTokenBalances,
      }
    },
  }
})

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      addresses: {
        btcAddresses: {
          btcReceivingAddresses: ['bc1qtest'],
          btcChangeAddresses: [],
        },
        mlAddresses: {
          mlReceivingAddresses: ['mtc1qtest'],
          mlChangeAddresses: [],
        },
      },
    }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
    BitcoinContext: makeCtx({
      unusedAddresses: { receivingAddress: 'bc1qtest' },
    }),
    MintlayerContext: makeCtx({
      unusedAddresses: { receive: 'mtc1qtest' },
      tokenBalances: {
        tmltk1q2c7d9a4hm3: {
          balance: 10,
          token_info: {
            token_id: 'tmltk1q2c7d9a4hm3',
            token_ticker: { string: 'CBEAT', hex: '0x4342454154' },
            number_of_decimals: 2,
            icon_uri: {
              hex: '0x68747470733a2f2f65782e636f6d2f69636f6e2e706e67',
              string: 'https://example.com/icon.png',
            },
          },
        },
      },
    }),
  }
})

const renderAt = (id) =>
  render(
    <MemoryRouter initialEntries={[`/asset/${id}`]}>
      <Routes>
        <Route
          path="/asset/:id"
          element={<AssetPage />}
        />
      </Routes>
    </MemoryRouter>,
  )

// Required after the jest.mock hoisting block.
// eslint-disable-next-line import/first
const AssetPage = require('./AssetPage').default

describe('AssetPage', () => {
  afterAll(() => {
    errorSpy.mockRestore()
  })

  it.each(['Mintlayer', 'Bitcoin'])(
    'renders the %s asset screen without crashing',
    (id) => {
      const { container } = renderAt(id)
      expect(container).not.toBeEmptyDOMElement()
    },
  )

  it('renders a real Mintlayer token from tokenBalances', () => {
    const { container } = renderAt(TOKEN_ID)

    expect(container.textContent).toContain('CBEAT')
    expect(container.textContent).toContain(TOKEN_ID)
    expect(container.textContent).toContain('Decimals')
    expect(container.textContent).toContain('Token info')
    // Balance comes from the token-scoped hook (10 CBEAT), not the ML coin balance.
    expect(container.textContent).toContain('10')
    // No fake price data for tokens.
    expect(container.textContent).not.toContain('$')
  })

  it('renders the token metadata icon', () => {
    const { getByTestId } = renderAt(TOKEN_ID)

    const img = getByTestId('token-icon-image')
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png')
  })

  it('renders an unknown token id without crashing', () => {
    const { container } = renderAt('tmltkdoesnotexist')
    expect(container).not.toBeEmptyDOMElement()
  })
})
