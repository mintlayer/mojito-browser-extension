import {
  getParsedTransactions,
  getAmountInAtoms,
  getAmountInCoins,
  isMlAddressValid,
} from './ML.js'
import { AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('unlockedAccount', { name: 'one' })

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
          inputs: [
            {
              utxo: {
                destination: 'address2',
                type: 'Transfer',
                value: { amount: 100000000 },
              },
            },
          ],
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
          // TODO: fix this test after switching to API balance
          // value: 1,
          value: 0,
          confirmations: 1,
          date: 1000,
          txid: 'txid1',
          fee: 10000,
          isConfirmed: true,
          type: 'Transfer',
          sameWalletTransaction: false,
        },
      ]
      expect(getParsedTransactions(transactions, addresses)).toEqual(
        expectedParsedTransactions,
      )
    })
  })
})

describe('isMlAddressValid', () => {
  const mainnetAddress = 'mtc1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka'
  const testnetAddress = 'tmt1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka'

  it('should return true for valid mainnet address', () => {
    expect(
      isMlAddressValid(mainnetAddress, AppInfo.NETWORK_TYPES.MAINNET),
    ).toBe(true)
  })

  it('should return true for valid testnet address', () => {
    expect(
      isMlAddressValid(testnetAddress, AppInfo.NETWORK_TYPES.TESTNET),
    ).toBe(true)
  })

  it('should return false for invalid mainnet address', () => {
    expect(
      isMlAddressValid(testnetAddress, AppInfo.NETWORK_TYPES.MAINNET),
    ).toBe(false)
  })

  it('should return false for invalid testnet address', () => {
    expect(
      isMlAddressValid(mainnetAddress, AppInfo.NETWORK_TYPES.TESTNET),
    ).toBe(false)
  })
})
