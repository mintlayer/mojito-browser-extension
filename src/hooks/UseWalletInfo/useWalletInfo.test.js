import { renderHook, act, waitFor } from '@testing-library/react'

import useWalletInfo from './useWalletInfo'
import { rawTransactions } from '@TestData'

test('UseWalletInfo hook', async () => {
  const returnTxs = {
    ok: true,
    text: async () => JSON.stringify(rawTransactions),
  }

  const returnUtxos = {
    ok: true,
    text: async () =>
      JSON.stringify([
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
      ]),
  }

  jest
    .spyOn(window, 'fetch')
    .mockImplementationOnce(async (url) => {
      const response = url.includes('utxo') ? returnUtxos : returnTxs

      return response
    })
    .mockImplementationOnce(async (url) => {
      window.fetch.mockRestore()
      const response = url.includes('utxo') ? returnUtxos : returnTxs

      return response
    })

  const address = '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'

  let result
  await act(async () => {
    result = renderHook(() => useWalletInfo(address)).result
  })

  let balance, transactionsList

  await waitFor(() => {
    balance = result.current.balance
    transactionsList = result.current.transactionsList
  })

  expect(balance).toBe('0.02881771')
  expect(transactionsList.length).toBe(rawTransactions.length)
})

test('UseWalletInfo hook, errors', async () => {
  jest
    .spyOn(window, 'fetch')
    .mockImplementationOnce(async () => {
      return null
    })
    .mockImplementationOnce(async () => {
      window.fetch.mockRestore()
      return null
    })

  jest
    .spyOn(console, 'error')
    .mockImplementationOnce((error) => {
      expect(error).toBeInstanceOf(Error)
      return null
    })
    .mockImplementationOnce((error) => {
      expect(error).toBeInstanceOf(Error)
      return null
    })
    .mockImplementationOnce((error) => {
      expect(error).toBeInstanceOf(Error)
      return null
    })
    .mockImplementationOnce((error) => {
      expect(error).toBeInstanceOf(Error)
      console.error.mockRestore()
      return null
    })

  const { result } = renderHook(() => useWalletInfo('dadadadada'))

  const { balance, transactionsList } = result.current

  expect(balance).toBe(0)
  expect(transactionsList).toStrictEqual([])
})
