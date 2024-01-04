import {
  getParsedTransactions,
  getAmountInAtoms,
  getAmountInCoins,
} from './ML.js'
import { AppInfo } from '@Constants'

describe('ML', () => {
  describe('getAmountInCoins', () => {
    it('should convert amount in atoms to coins', () => {
      const atoms = AppInfo.ML_ATOMS_PER_COIN
      const expectedCoins = 1
      expect(getAmountInCoins(atoms)).toEqual(expectedCoins)
    })
  })

  describe('getAmountInAtoms', () => {
    it('should convert amount in coins to atoms', () => {
      const coins = 1
      const expectedAtoms = AppInfo.ML_ATOMS_PER_COIN
      expect(getAmountInAtoms(coins)).toEqual(expectedAtoms)
    })
  })

  describe('getParsedTransactions', () => {
    it('should parse transactions', () => {
      const transactions = [
        {
          outputs: [
            {
              destination: 'address1',
              value: { amount: AppInfo.ML_ATOMS_PER_COIN },
            },
            { destination: 'address2', value: { amount: 200000000 } },
          ],
          timestamp: 1000,
          confirmations: 1,
          txid: 'txid1',
          fee: 10000,
        },
      ]
      const addresses = ['address1']
      const expectedParsedTransactions = [
        {
          direction: 'in',
          destAddress: 'address2',
          value: 1,
          confirmations: 1,
          date: 1000,
          txid: 'txid1',
          fee: 10000,
          isConfirmed: true,
        },
      ]
      expect(getParsedTransactions(transactions, addresses)).toEqual(
        expectedParsedTransactions,
      )
    })
  })
})
