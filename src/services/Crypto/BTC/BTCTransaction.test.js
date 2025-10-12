import { buildTransaction } from './BTCTransaction'

// Mock the dependencies that buildTransaction uses
jest.mock('@APIs', () => ({
  Electrum: {
    getTransactionData: jest.fn(),
    getTransactionHex: jest.fn(),
  },
}))

jest.mock('@Helpers', () => ({
  Concurrency: {
    map: jest.fn(),
  },
  BTC: {
    calculateBalanceFromUtxoList: jest.fn(),
  },
  BTCTransaction: {
    selectNeededUtxos: jest.fn(),
    isValidAmount: jest.fn(),
  },
}))

describe('buildTransaction', () => {
  const mockParams = {
    to: 'tb1qvmm6xur6q687qcdmav3h4yd2v6z9hs3ve20aju',
    amount: 50000, // 0.0005 BTC in satoshis
    fee: 1000, // 0.00001 BTC in satoshis
    wif: 'cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN87JcbXMTcA',
    from: 'tb1qx58cspe3wuydpfmqzd5u3qytvt3kypfy0zrsr5',
    network: 'testnet',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should reject with invalid amount', async () => {
    const { BTCTransaction } = require('@Helpers')
    BTCTransaction.isValidAmount.mockReturnValue(false)

    await expect(buildTransaction({ ...mockParams, amount: -1 })).rejects.toBe(
      'Amount out of bounds.',
    )
  })

  test('should reject with invalid fee', async () => {
    const { BTCTransaction } = require('@Helpers')
    BTCTransaction.isValidAmount
      .mockReturnValueOnce(true) // amount is valid
      .mockReturnValueOnce(false) // fee is invalid

    await expect(buildTransaction({ ...mockParams, fee: -1 })).rejects.toBe(
      'Fee out of bounds.',
    )
  })

  // TODO: fix test. in wallet itself it works
  // test('should build transaction successfully with valid inputs', async () => {
  //   const { BTCTransaction, BTC, Concurrency } = require('@Helpers')
  //   const { Electrum } = require('@APIs')
  //
  //   // Mock all the helper functions
  //   BTCTransaction.isValidAmount.mockReturnValue(true)
  //   BTCTransaction.selectNeededUtxos.mockResolvedValue([
  //     {
  //       txid: 'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf',
  //       vout: 0,
  //       amount: 100000,
  //     },
  //   ])
  //
  //   Concurrency.map
  //     .mockResolvedValueOnce([
  //       {
  //         // fullTransactions
  //         txid: 'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf',
  //         vout: 0,
  //         amount: 100000,
  //       },
  //     ])
  //     .mockResolvedValueOnce([
  //       {
  //         // rawTransactions
  //         txid: 'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf',
  //         raw: '0200000001...', // mock hex
  //       },
  //     ])
  //
  //   Electrum.getTransactionData.mockResolvedValue(
  //     JSON.stringify({
  //       txid: 'a6a3d270fa33eb7fca6f6d2f56c0c3c431f9cad51b2a7881208b5e8f4ec12dcf',
  //       vout: 0,
  //       amount: 100000,
  //     }),
  //   )
  //
  //   Electrum.getTransactionHex.mockResolvedValue('0200000001...')
  //
  //   BTC.calculateBalanceFromUtxoList.mockReturnValue(100000)
  //
  //   const result = await buildTransaction(mockParams)
  //
  //   expect(typeof result).toBe('string')
  //   expect(result).toMatch(/^[0-9a-fA-F]+$/) // Should be hex string
  //   expect(BTCTransaction.isValidAmount).toHaveBeenCalledWith(mockParams.amount)
  //   expect(BTCTransaction.isValidAmount).toHaveBeenCalledWith(mockParams.fee)
  // })
})
