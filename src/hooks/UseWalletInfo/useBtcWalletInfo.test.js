import { renderHook, act } from '@testing-library/react'
import useBtcWalletInfo from './useBtcWalletInfo'
import { AccountProvider, SettingsProvider, BitcoinProvider } from '@Contexts'

const mockContextValue = {
  btcBalance: '0.02881771',
  btcTransactions: [
    { id: 1, amount: 0.5 },
    { id: 2, amount: 0.73 },
  ],
  btcUtxos: [
    {
      txid: '6106cf34a6b0fd1d4f81bc7644237adb1f40a7da0cafff7c90212c053e63ee6e',
      vout: 1,
      status: {},
      value: 881771,
    },
    {
      txid: '6ec6b313788063402c7404b00433b7a30bb511fb2f73429097e0cbc4dea3be33',
      vout: 0,
      status: {},
      value: 2000000,
    },
  ],
  currentBlockHeight: 680000,
  fetchingBalances: false,
  fetchingTransactions: false,
  fetchingUtxos: false,
  setFetchingBalances: jest.fn(),
  setFetchingTransactions: jest.fn(),
  setFetchingUtxos: jest.fn(),
}

const Wrapper = ({ children }) => (
  <AccountProvider
    value={{
      balanceLoading: false,
      walletType: {
        name: 'Bitcoin',
      },
      addresses: {
        btcMainnetAddresses: ['1MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'],
        btcTestnetAddresses: ['1MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'],
      },
    }}
  >
    <SettingsProvider value={{ networkType: 'testnet' }}>
      <BitcoinProvider value={mockContextValue}>{children}</BitcoinProvider>
    </SettingsProvider>
  </AccountProvider>
)

const address = '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'

test('returns the correct context values', async () => {
  let result
  await act(async () => {
    result = renderHook(() => useBtcWalletInfo(address), {
      wrapper: Wrapper,
    }).result
  })

  expect(result.current.transactions).toEqual(mockContextValue.btcTransactions)
  expect(result.current.balance).toEqual(mockContextValue.btcBalance)
  expect(result.current.utxos).toEqual(mockContextValue.btcUtxos)
  expect(result.current.currentBlockHeight).toEqual(
    mockContextValue.currentBlockHeight,
  )
  expect(result.current.fetchingBalances).toEqual(
    mockContextValue.fetchingBalances,
  )
  expect(result.current.fetchingTransactions).toEqual(
    mockContextValue.fetchingTransactions,
  )
  expect(result.current.fetchingUtxos).toEqual(mockContextValue.fetchingUtxos)
  expect(result.current.setFetchingBalances).toEqual(
    mockContextValue.setFetchingBalances,
  )
  expect(result.current.setFetchingTransactions).toEqual(
    mockContextValue.setFetchingTransactions,
  )
  expect(result.current.setFetchingUtxos).toEqual(
    mockContextValue.setFetchingUtxos,
  )
})
