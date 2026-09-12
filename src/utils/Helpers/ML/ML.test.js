import {
  getParsedTransactions,
  getAmountInAtoms,
  getAmountInCoins,
  isMlAddressValid,
  buildStakeGrowthSeries,
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
      expect(getAmountInAtoms(coins).toString()).toEqual(
        expectedAtoms.toString(),
      )
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
                value: {
                  amount: {
                    atoms: '100000000',
                    decimal: '0.001',
                  },
                },
              },
            },
          ],
          outputs: [
            {
              destination: 'address1',
              value: { amount: AppInfo.ML_ATOMS_PER_COIN },
            },
            {
              destination: 'address2',
              value: {
                amount: {
                  atoms: '200000000',
                  decimal: '0.002',
                },
              },
            },
          ],
          timestamp: 1000,
          confirmations: 1,
          txid: 'txid1',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]
      const addresses = ['address1']
      const expectedParsedTransactions = [
        {
          blockId: undefined,
          direction: 'in',
          destAddress: 'address2',
          // TODO: fix this test after switching to API balance
          // value: 1,
          value: 0,
          confirmations: 1,
          date: 1000,
          txid: 'txid1',
          fee: '0.0000001',
          isConfirmed: true,
          nft_id: undefined,
          order_id: null,
          type: 'Transfer',
          sameWalletTransaction: false,
          token_id: undefined,
        },
      ]

      const parsedTx = getParsedTransactions(transactions, addresses)
      expect(parsedTx).toEqual(expectedParsedTransactions)
    })

    it('sums multiple outbound Transfer outputs numerically', () => {
      const transactions = [
        {
          inputs: [{ utxo: { destination: 'address1' } }],
          outputs: [
            {
              destination: 'address1',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '100000000', decimal: '0.001' },
              },
            },
            {
              destination: 'address2',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '150000000000', decimal: '1.5' },
              },
            },
            {
              destination: 'address3',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '70000000000', decimal: '0.7' },
              },
            },
          ],
          timestamp: 1000,
          confirmations: 1,
          txid: 'txid2',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]

      const parsedTx = getParsedTransactions(transactions, ['address1'])
      // 1.5 + 0.7 — string concatenation would produce '1.50.7' -> NaN
      expect(parsedTx[0].value).toBe(2.2)
      expect(parsedTx[0].direction).toBe('out')
    })

    it('sums multiple inbound Transfer outputs numerically', () => {
      const transactions = [
        {
          inputs: [{ utxo: { destination: 'addressX' } }],
          outputs: [
            {
              destination: 'address1',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '50000000000', decimal: '0.5' },
              },
            },
            {
              destination: 'address1',
              type: 'Transfer',
              value: {
                type: 'Coin',
                amount: { atoms: '25000000000', decimal: '0.25' },
              },
            },
          ],
          timestamp: 2000,
          confirmations: 1,
          txid: 'txid3',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]

      const parsedTx = getParsedTransactions(transactions, ['address1'])
      expect(parsedTx[0].value).toBe(0.75)
      expect(parsedTx[0].direction).toBe('in')
    })
  })
})

describe('buildStakeGrowthSeries', () => {
  const stakeTx = (value, date, txid) => ({
    type: 'DelegateStaking',
    direction: 'out',
    value,
    date,
    txid,
  })
  const withdrawTx = (value, date, txid) => ({
    type: 'Delegate Withdrawal',
    direction: 'in',
    value,
    date,
    txid,
  })

  it('returns an empty series when there is no staking activity', () => {
    const { series, contributed, withdrawn } = buildStakeGrowthSeries(
      [{ type: 'Transfer', direction: 'in', value: 5, date: 100, txid: 't1' }],
      0,
    )
    expect(series).toEqual([])
    expect(contributed).toBe(0)
    expect(withdrawn).toBe(0)
  })

  it('handles undefined transactions', () => {
    const { series } = buildStakeGrowthSeries(undefined, 0)
    expect(series).toEqual([])
  })

  it('builds a cumulative series ordered by date and anchors the live total', () => {
    const transactions = [
      stakeTx(100, 300, 't3'),
      stakeTx(50, 100, 't1'),
      stakeTx(200, 200, 't2'),
    ]
    const { series, contributed, withdrawn } = buildStakeGrowthSeries(
      transactions,
      360,
    )
    // starts at 0, then 50, 250, 350 and jumps to the live total 360
    expect(series).toEqual([0, 50, 250, 350, 360])
    expect(contributed).toBe(350)
    expect(withdrawn).toBe(0)
  })

  it('subtracts withdrawals', () => {
    const transactions = [
      stakeTx(100, 100, 't1'),
      withdrawTx(40, 200, 't2'),
      stakeTx(20, 300, 't3'),
    ]
    const { series, contributed, withdrawn } = buildStakeGrowthSeries(
      transactions,
      80,
    )
    expect(series).toEqual([0, 100, 60, 80])
    expect(contributed).toBe(120)
    expect(withdrawn).toBe(40)
  })

  it('does not duplicate the final point when it already matches the live total', () => {
    const { series } = buildStakeGrowthSeries([stakeTx(50, 100, 't1')], 50)
    expect(series).toEqual([0, 50])
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

  it('should accept mainnet multisig addresses (mmtc1…)', () => {
    expect(
      isMlAddressValid(
        'mmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2',
        AppInfo.NETWORK_TYPES.MAINNET,
      ),
    ).toBe(true)
  })

  it('should accept testnet multisig addresses (tmtc1…)', () => {
    expect(
      isMlAddressValid(
        'tmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2',
        AppInfo.NETWORK_TYPES.TESTNET,
      ),
    ).toBe(true)
  })

  it('should reject a mainnet multisig address on testnet and vice versa', () => {
    expect(
      isMlAddressValid(
        'mmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2',
        AppInfo.NETWORK_TYPES.TESTNET,
      ),
    ).toBe(false)
    expect(
      isMlAddressValid(
        'tmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2',
        AppInfo.NETWORK_TYPES.MAINNET,
      ),
    ).toBe(false)
  })
})
