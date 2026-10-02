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

    it('returns the getSwapDetails {from,to} value for an outbound FillOrder swap with 2+ outputs', () => {
      // Fixture shape follows the wallet's real FillOrder transactions: an
      // AccountCommand FillOrder input (no utxo) plus a UTXO fee input, and
      // both swap proceeds coming back to the wallet (coin change + bought
      // token). fill_atoms carries .atoms, so the swap path must fire.
      const myAddress = 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'
      const orderId =
        'tordr1vz77jslw082ahk6n0h3nxzaklez7pyxkrlj6j0hy6ck9ykhzzw7sx3uaxn'
      const tokenId =
        'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530'
      const transactions = [
        {
          inputs: [
            {
              input: {
                command: 'FillOrder',
                destination: myAddress,
                fill_atoms: { atoms: '1000000000000' },
                input_type: 'AccountCommand',
                nonce: '0',
                order_id: orderId,
              },
              utxo: null,
            },
            {
              input: {
                input_type: 'UTXO',
                index: 1,
                source_id:
                  'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                source_type: 'Transaction',
              },
              utxo: {
                destination: myAddress,
                type: 'Transfer',
                value: {
                  amount: { atoms: '10000000000000', decimal: '100' },
                  type: 'Coin',
                },
              },
            },
          ],
          outputs: [
            {
              destination: myAddress,
              type: 'Transfer',
              value: {
                amount: { atoms: '9990000000000', decimal: '99.9' },
                type: 'Coin',
              },
            },
            {
              destination: myAddress,
              type: 'Transfer',
              value: {
                amount: { atoms: '5000000000000', decimal: '5' },
                type: 'Token',
                token_id: tokenId,
              },
            },
          ],
          timestamp: 3000,
          confirmations: 1,
          id: 'txfill1',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]

      const [parsed] = getParsedTransactions(transactions, [myAddress])

      expect(parsed.direction).toBe('out')
      expect(parsed.type).toBe('FillOrder')
      expect(parsed.order_id).toBe(orderId)
      // 100 coin in, 99.9 coin + 5 token out => swapped 0.1 coin for 5 token.
      expect(parsed.value).toEqual({
        from: { Coin: 'Coin', amount: '0.1' },
        to: { token_id: tokenId, amount: '5' },
      })
    })

    it('keeps the outbound FillOrder accumulator numeric when a swap output precedes Transfer outputs', () => {
      // Explorer data ships fill_atoms as a plain string, so .atoms is
      // undefined and each output falls through to the Transfer branch. The
      // accumulator must add Number(decimal): string concatenation would
      // build '0' + '0.5' + '0.7' => '00.50.7' (NaN-ish garbage).
      const myAddress = 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'
      const otherAddress1 = 'tmt1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka5jm6f0'
      const otherAddress2 = 'tmt1q0k8fj3yq9mz6xv2hc4alq5ngd7re9p2ws3tu1'
      const orderId =
        'tordr1vz77jslw082ahk6n0h3nxzaklez7pyxkrlj6j0hy6ck9ykhzzw7sx3uaxn'
      const transactions = [
        {
          inputs: [
            {
              input: {
                command: 'FillOrder',
                destination: myAddress,
                fill_atoms: '1000000000000',
                input_type: 'AccountCommand',
                nonce: '0',
                order_id: orderId,
              },
              utxo: null,
            },
            {
              input: {
                input_type: 'UTXO',
                index: 1,
                source_id:
                  'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                source_type: 'Transaction',
              },
              utxo: {
                destination: myAddress,
                type: 'Transfer',
                value: {
                  amount: { atoms: '10000000000000', decimal: '100' },
                  type: 'Coin',
                },
              },
            },
          ],
          outputs: [
            {
              destination: otherAddress1,
              type: 'Transfer',
              value: {
                amount: { atoms: '50000000000', decimal: '0.5' },
                type: 'Coin',
              },
            },
            {
              destination: otherAddress2,
              type: 'Transfer',
              value: {
                amount: { atoms: '70000000000', decimal: '0.7' },
                type: 'Coin',
              },
            },
          ],
          timestamp: 4000,
          confirmations: 1,
          id: 'txfill2',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]

      const [parsed] = getParsedTransactions(transactions, [myAddress])

      expect(parsed.type).toBe('FillOrder')
      expect(parsed.order_id).toBe(orderId)
      expect(parsed.value).toBe(1.2)
      expect(typeof parsed.value).toBe('number')
    })

    it('builds swap details even when the swap proceeds go to an external address', () => {
      // The not-my-output branch of the reduce must also detect the FillOrder
      // swap (fill_atoms.atoms present) instead of summing the output.
      const myAddress = 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'
      const otherAddress = 'tmt1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka5jm6f0'
      const orderId =
        'tordr1vz77jslw082ahk6n0h3nxzaklez7pyxkrlj6j0hy6ck9ykhzzw7sx3uaxn'
      const tokenId =
        'tmltk1une5v627lk0cln0y4g8cxxvk62rye9qaqp97h2m5r5puljyqzgrqrq5530'
      const transactions = [
        {
          inputs: [
            {
              input: {
                command: 'FillOrder',
                destination: myAddress,
                fill_atoms: { atoms: '1000000000000' },
                input_type: 'AccountCommand',
                nonce: '0',
                order_id: orderId,
              },
              utxo: null,
            },
            {
              input: {
                input_type: 'UTXO',
                index: 1,
                source_id:
                  'c4b5ad06ce2d8f0663508ef8db4c4e0e23d2b5eaeeb3da5ecbe5c9ab1b7c2dee',
                source_type: 'Transaction',
              },
              utxo: {
                destination: myAddress,
                type: 'Transfer',
                value: {
                  amount: { atoms: '10000000000000', decimal: '100' },
                  type: 'Coin',
                },
              },
            },
          ],
          outputs: [
            {
              destination: otherAddress,
              type: 'Transfer',
              value: {
                amount: { atoms: '9990000000000', decimal: '99.9' },
                type: 'Coin',
              },
            },
            {
              destination: myAddress,
              type: 'Transfer',
              value: {
                amount: { atoms: '5000000000000', decimal: '5' },
                type: 'Token',
                token_id: tokenId,
              },
            },
          ],
          timestamp: 5000,
          confirmations: 1,
          id: 'txfill3',
          fee: { atoms: '10000', decimal: '0.0000001' },
        },
      ]

      const [parsed] = getParsedTransactions(transactions, [myAddress])

      expect(parsed.direction).toBe('out')
      expect(parsed.type).toBe('FillOrder')
      expect(parsed.value).toEqual({
        from: { Coin: 'Coin', amount: '0.1' },
        to: { token_id: tokenId, amount: '5' },
      })
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
  const testnetAddress = 'tmt1qydxtnueeh3g8ge8mmp9rmgu6u468a2frqrzr9ka5jm6f0'

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
        'tmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2pm8ep8',
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
        'tmtc1q3v0hye8eg6vg7f7thmpy6y834u8h0r4as0hyax2pm8ep8',
        AppInfo.NETWORK_TYPES.MAINNET,
      ),
    ).toBe(false)
  })
})
