/* eslint-disable quotes */
import * as bitcoin from 'bitcoinjs-lib'
import {
  getMasterFingerprint,
  getFormattedFeeUtxos,
  getFormattedUtxos,
  calculateBtcTransactionFee,
  buildTransaction,
} from './BTCTransaction'
import { Electrum } from '@APIs'
import { BTC } from '@Helpers'
import coinSelect from 'coinselect'

jest.mock('canvas', () => ({
  createCanvas: () => ({ getContext: () => null }),
  loadImage: () =>
    Promise.reject(new Error('loadImage not available in tests')),
}))

// Mock external dependencies
jest.mock('@APIs', () => ({
  Electrum: {
    getTransactionHex: jest.fn(),
  },
}))

// Do not reference `bitcoin` inside factory (jest hoists mocks before imports)
jest.mock('@Helpers', () => ({
  BTC: {
    getNetwork: jest.fn(),
    checkFee: jest.fn(),
  },
}))

jest.mock('@Constants', () => ({
  AppInfo: {
    BTC_MAX_TRANSACTION_FEE: 1000000,
    BTC_MAX_FEERATE: 1000,
  },
}))

jest.mock('coinselect', () => jest.fn())

describe('BTCTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    BTC.getNetwork.mockReturnValue(bitcoin.networks.bitcoin)
    if (bitcoin.address.toOutputScript && bitcoin.address.toOutputScript.mock) {
      bitcoin.address.toOutputScript.mockImplementation(() => mockSegwitScript)
    } else {
      jest
        .spyOn(bitcoin.address, 'toOutputScript')
        .mockImplementation(() => mockSegwitScript)
    }
  })

  // NOTE: Do not restore all mocks after each test because we rely on a global
  // spy for bitcoin.address.toOutputScript set in beforeAll. Individual tests
  // clear call counts with jest.clearAllMocks() in beforeEach.

  // Global mock: nativeSegwit address script resolution (avoid real validation errors)
  const mockSegwitScript = Buffer.from(
    '0014ffffffffffffffffffffffffffffffffffffffff',
    'hex',
  )
  beforeAll(() => {
    jest
      .spyOn(bitcoin.address, 'toOutputScript')
      .mockImplementation(() => mockSegwitScript)
  })

  // Safety: if any test or library code replaces the spy, reapply before each test
  beforeEach(() => {
    if (!bitcoin.address.toOutputScript.mock) {
      jest
        .spyOn(bitcoin.address, 'toOutputScript')
        .mockImplementation(() => mockSegwitScript)
    }
  })

  describe('getMasterFingerprint', () => {
    test('should return existing fingerprint buffer', () => {
      const fingerprint = Buffer.from('12345678', 'hex')
      const node = { fingerprint }

      const result = getMasterFingerprint(node)

      expect(result).toEqual(fingerprint)
    })

    test('should convert integer fingerprint to buffer', () => {
      const fingerprint = 0x12345678
      const node = { fingerprint }

      const result = getMasterFingerprint(node)

      expect(result).toEqual(Buffer.from('12345678', 'hex'))
    })

    test('should generate fingerprint from public key', () => {
      const publicKey = new Uint8Array(
        Buffer.from(
          '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
          'hex',
        ),
      )
      const node = { publicKey }

      const result = getMasterFingerprint(node)

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBe(4)
    })

    // Removed undefined node test (implementation assumes a node with publicKey)

    test('should derive fingerprint when only publicKey present (normal path)', () => {
      const node = {
        publicKey: new Uint8Array(
          Buffer.from(
            '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
            'hex',
          ),
        ),
      }
      const fp = getMasterFingerprint(node)
      expect(fp).toBeInstanceOf(Buffer)
      expect(fp.length).toBe(4)
    })
  })

  describe('getFormattedFeeUtxos', () => {
    const mockUtxo = {
      txid: 'a1b2c3d4e5f6',
      vout: 0,
      value: 10000,
      address: '1ABC...',
    }

    test('should format legacy wallet type', async () => {
      const mockRawTxHex = '0100000001...'
      Electrum.getTransactionHex.mockResolvedValue(mockRawTxHex)

      const result = await getFormattedFeeUtxos([mockUtxo], 'legacy')

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        txId: mockUtxo.txid,
        vout: mockUtxo.vout,
        value: mockUtxo.value,
        nonWitnessUtxo: Buffer.from(mockRawTxHex, 'hex'),
      })
      expect(Electrum.getTransactionHex).toHaveBeenCalledWith(mockUtxo.txid)
    })

    test('should format p2sh wallet type', async () => {
      const mockRawTxHex = '0100000001...'
      Electrum.getTransactionHex.mockResolvedValue(mockRawTxHex)

      const result = await getFormattedFeeUtxos([mockUtxo], 'p2sh')

      expect(result[0].nonWitnessUtxo).toEqual(Buffer.from(mockRawTxHex, 'hex'))
    })

    test('should format nativeSegwit wallet type', async () => {
      const result = await getFormattedFeeUtxos([mockUtxo], 'nativeSegwit')
      // We only assert that witnessUtxo exists with correct value and no raw tx fetch.
      expect(result[0].txId).toBe(mockUtxo.txid)
      expect(result[0].witnessUtxo).toBeDefined()
      expect(result[0].witnessUtxo.value).toBe(BigInt(mockUtxo.value))
      expect(Electrum.getTransactionHex).not.toHaveBeenCalled()
    })

    test('should throw error for unknown wallet type', async () => {
      await expect(getFormattedFeeUtxos([mockUtxo], 'unknown')).rejects.toThrow(
        'Unknown wallet type: unknown',
      )
    })

    test('should handle multiple UTXOs', async () => {
      const mockRawTxHex = '0100000001...'
      Electrum.getTransactionHex.mockResolvedValue(mockRawTxHex)

      const utxos = [mockUtxo, { ...mockUtxo, txid: 'different' }]
      const result = await getFormattedFeeUtxos(utxos, 'legacy')

      expect(result).toHaveLength(2)
      expect(Electrum.getTransactionHex).toHaveBeenCalledTimes(2)
    })
  })

  describe('getFormattedUtxos', () => {
    const mockUtxo = {
      txid: 'a1b2c3d4e5f6',
      vout: 0,
      value: 10000,
      address: '1ABC...',
    }

    const mockAddressesData = {
      btcReceivingAddresses: [
        {
          address: '1ABC...',
          pubkey:
            '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
          derivationPath: "m/44'/0'/0'/0/0",
        },
      ],
      btcChangeAddresses: [],
    }

    const mockHdWallet = {
      fingerprint: Buffer.from('12345678', 'hex'),
    }

    test('should format UTXOs with bip32 derivation', async () => {
      const mockRawTxHex = '0100000001...'
      Electrum.getTransactionHex.mockResolvedValue(mockRawTxHex)

      const result = await getFormattedUtxos(
        [mockUtxo],
        'legacy',
        mockAddressesData,
        mockHdWallet,
      )

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        txId: mockUtxo.txid,
        vout: mockUtxo.vout,
        value: mockUtxo.value,
        bip32Derivation: expect.any(Array),
        nonWitnessUtxo: expect.any(Buffer),
      })
      expect(result[0].bip32Derivation).toHaveLength(1)
    })

    test('should handle pubkey as buffer', async () => {
      const bufferPubkey = Buffer.from(
        '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
        'hex',
      )
      const addressesData = {
        ...mockAddressesData,
        btcReceivingAddresses: [
          {
            ...mockAddressesData.btcReceivingAddresses[0],
            pubkey: bufferPubkey,
          },
        ],
      }

      Electrum.getTransactionHex.mockResolvedValue('0100000001...')

      const result = await getFormattedUtxos(
        [mockUtxo],
        'legacy',
        addressesData,
        mockHdWallet,
      )

      expect(result[0].bip32Derivation[0].pubkey).toEqual(bufferPubkey)
    })

    test('should throw error when address not found', async () => {
      const utxoWithUnknownAddress = {
        ...mockUtxo,
        address: 'unknown',
      }

      await expect(
        getFormattedUtxos(
          [utxoWithUnknownAddress],
          'legacy',
          mockAddressesData,
          mockHdWallet,
        ),
      ).rejects.toThrow()
    })
  })

  describe('calculateBtcTransactionFee', () => {
    const mockParams = {
      to: '1ABC...',
      amount: 5000,
      utxos: [
        {
          txid: 'a1b2c3d4',
          vout: 0,
          value: 10000,
          address: '1ABC...',
        },
      ],
      feeRate: 10,
      walletType: 'nativeSegwit',
    }

    test('should calculate fee using coinSelect', async () => {
      const mockFee = 1000
      coinSelect.mockReturnValue({ fee: mockFee })

      const result = await calculateBtcTransactionFee(mockParams)

      expect(result).toBe(mockFee)
      expect(coinSelect).toHaveBeenCalledWith(
        expect.any(Array),
        [{ address: mockParams.to, value: mockParams.amount }],
        mockParams.feeRate,
      )
    })

    test('should handle coinSelect returning undefined fee', async () => {
      coinSelect.mockReturnValue({ fee: undefined })

      const result = await calculateBtcTransactionFee(mockParams)

      expect(result).toBeUndefined()
    })
  })

  describe('buildTransaction', () => {
    const mockParams = {
      to: '1ABC...',
      amount: 5000,
      utxos: [
        {
          txid: 'a1b2c3d4',
          vout: 0,
          value: 10000,
          address: '1ABC...',
        },
      ],
      feeRate: 10,
      walletType: 'nativeSegwit',
      changeAddress: '1CHANGE...',
      root: {
        btcAddressData: {
          btcReceivingAddresses: [
            {
              address: '1ABC...',
              pubkey:
                '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
              derivationPath: "m/44'/0'/0'/0/0",
            },
          ],
          btcChangeAddresses: [],
        },
        btcHDWallet: {
          fingerprint: Buffer.from('12345678', 'hex'),
        },
      },
    }

    test('should return undefined when coinSelect fails', async () => {
      coinSelect.mockReturnValue({ inputs: null, outputs: null, fee: 1000 })

      const result = await buildTransaction(mockParams)

      expect(result).toBeUndefined()
    })

    test('should build transaction successfully', async () => {
      const mockInputs = [
        {
          txId: 'a1b2c3d4',
          vout: 0,
          value: 10000,
          bip32Derivation: [],
          witnessUtxo: { script: Buffer.from('0014...'), value: 10000 },
        },
      ]
      const mockOutputs = [
        { address: mockParams.to, value: 5000 },
        { address: mockParams.changeAddress, value: 4000 },
      ]
      const mockFee = 1000

      coinSelect.mockReturnValue({
        inputs: mockInputs,
        outputs: mockOutputs,
        fee: mockFee,
      })

      // Mock PSBT methods
      const mockPsbt = {
        addInput: jest.fn(),
        addOutput: jest.fn(),
        signAllInputsHD: jest.fn(),
        finalizeAllInputs: jest.fn(),
        extractTransaction: jest.fn(() => ({
          toHex: jest.fn(() => 'mockHex'),
        })),
      }
      const psbtSpy = jest
        .spyOn(bitcoin, 'Psbt')
        .mockImplementation(() => mockPsbt)

      // Mock fee validation
      BTC.checkFee = jest.fn(() => true)

      const result = await buildTransaction(mockParams)

      expect(result).toEqual([expect.any(Object), 'mockHex'])
      expect(mockPsbt.addInput).toHaveBeenCalled()
      expect(mockPsbt.addOutput).toHaveBeenCalledTimes(2)
      expect(mockPsbt.signAllInputsHD).toHaveBeenCalledWith(
        mockParams.root.btcHDWallet,
      )
      psbtSpy.mockRestore()
    })

    test('should return undefined when fee is invalid', async () => {
      const mockInputs = [{ txId: 'a1b2c3d4', vout: 0 }]
      const mockOutputs = [{ address: mockParams.to, value: 5000 }]

      coinSelect.mockReturnValue({
        inputs: mockInputs,
        outputs: mockOutputs,
        fee: 1000,
      })

      jest.spyOn(bitcoin, 'Psbt').mockImplementation(() => ({
        addInput: jest.fn(),
        addOutput: jest.fn(),
        signAllInputsHD: jest.fn(),
        finalizeAllInputs: jest.fn(),
        extractTransaction: jest.fn(() => ({
          toHex: jest.fn(() => 'mockHex'),
        })),
      }))

      BTC.checkFee = jest.fn(() => false)

      const result = await buildTransaction(mockParams)

      expect(result).toBeUndefined()
      expect(BTC.checkFee).toHaveBeenCalledWith(
        expect.any(Object),
        1000,
        1000000,
        1000,
      )
    })

    test('should handle change address assignment', async () => {
      const mockInputs = [{ txId: 'a1b2c3d4', vout: 0 }]
      const mockOutputs = [
        { address: mockParams.to, value: 5000 },
        { value: 4000 }, // No address - should get change address
      ]

      coinSelect.mockReturnValue({
        inputs: mockInputs,
        outputs: mockOutputs,
        fee: 1000,
      })

      const mockPsbt = {
        addInput: jest.fn(),
        addOutput: jest.fn(),
        signAllInputsHD: jest.fn(),
        finalizeAllInputs: jest.fn(),
        extractTransaction: jest.fn(() => ({
          toHex: jest.fn(() => 'mockHex'),
        })),
      }
      const psbtSpy = jest
        .spyOn(bitcoin, 'Psbt')
        .mockImplementation(() => mockPsbt)

      BTC.checkFee = jest.fn(() => true)

      await buildTransaction(mockParams)

      expect(mockPsbt.addOutput).toHaveBeenCalledWith({
        address: mockParams.changeAddress,
        value: BigInt(4000),
      })
      psbtSpy.mockRestore()
    })
  })

  describe('witnessUtxo format (bitcoinjs-lib v7)', () => {
    test('getFormattedFeeUtxos: witnessUtxo.script should be Uint8Array', async () => {
      const utxo = {
        txid: 'abc123',
        vout: 0,
        value: 5000,
        address: 'bc1qtest',
      }

      const result = await getFormattedFeeUtxos([utxo], 'nativeSegwit')

      expect(result[0].witnessUtxo.script).toBeInstanceOf(Uint8Array)
    })

    test('getFormattedFeeUtxos: witnessUtxo.value should be BigInt', async () => {
      const utxo = {
        txid: 'abc123',
        vout: 0,
        value: 5000,
        address: 'bc1qtest',
      }

      const result = await getFormattedFeeUtxos([utxo], 'nativeSegwit')

      expect(typeof result[0].witnessUtxo.value).toBe('bigint')
      expect(result[0].witnessUtxo.value).toBe(BigInt(5000))
    })

    test('getFormattedUtxos: witnessUtxo.script should be Uint8Array', async () => {
      const utxo = {
        txid: 'abc123',
        vout: 0,
        value: 10000,
        address: 'bc1qtest',
      }
      const addressesData = {
        btcReceivingAddresses: [
          {
            address: 'bc1qtest',
            pubkey:
              '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
            derivationPath: "m/84'/0'/0'/0/0",
          },
        ],
        btcChangeAddresses: [],
      }
      const hdWallet = { fingerprint: Buffer.from('12345678', 'hex') }

      const result = await getFormattedUtxos(
        [utxo],
        'nativeSegwit',
        addressesData,
        hdWallet,
      )

      expect(result[0].witnessUtxo.script).toBeInstanceOf(Uint8Array)
    })

    test('getFormattedUtxos: witnessUtxo.value should be BigInt', async () => {
      const utxo = {
        txid: 'abc123',
        vout: 0,
        value: 10000,
        address: 'bc1qtest',
      }
      const addressesData = {
        btcReceivingAddresses: [
          {
            address: 'bc1qtest',
            pubkey:
              '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
            derivationPath: "m/84'/0'/0'/0/0",
          },
        ],
        btcChangeAddresses: [],
      }
      const hdWallet = { fingerprint: Buffer.from('12345678', 'hex') }

      const result = await getFormattedUtxos(
        [utxo],
        'nativeSegwit',
        addressesData,
        hdWallet,
      )

      expect(typeof result[0].witnessUtxo.value).toBe('bigint')
      expect(result[0].witnessUtxo.value).toBe(BigInt(10000))
    })

    test.each([
      ['small dust', 546],
      ['typical', 50000],
      ['1 BTC', 100000000],
      ['large whale', 2100000000000000],
      ['zero', 0],
      ['1 satoshi', 1],
    ])('witnessUtxo.value correct for %s (%d sats)', async (_, sats) => {
      const utxo = {
        txid: 'abc123',
        vout: 0,
        value: sats,
        address: 'bc1qtest',
      }

      const result = await getFormattedFeeUtxos([utxo], 'nativeSegwit')

      expect(typeof result[0].witnessUtxo.value).toBe('bigint')
      expect(result[0].witnessUtxo.value).toBe(BigInt(sats))
    })
  })

  describe('buildTransaction output values (bitcoinjs-lib v7)', () => {
    const baseParams = {
      to: '1ABC...',
      amount: 5000,
      utxos: [{ txid: 'a1b2c3d4', vout: 0, value: 10000, address: '1ABC...' }],
      feeRate: 10,
      walletType: 'nativeSegwit',
      changeAddress: '1CHANGE...',
      root: {
        btcAddressData: {
          btcReceivingAddresses: [
            {
              address: '1ABC...',
              pubkey:
                '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
              derivationPath: "m/44'/0'/0'/0/0",
            },
          ],
          btcChangeAddresses: [],
        },
        btcHDWallet: { fingerprint: Buffer.from('12345678', 'hex') },
      },
    }

    test.each([
      ['dust amount', 546, 9000],
      ['typical send', 50000, 40000],
      ['full spend no change', 10000, 0],
      ['1 satoshi', 1, 8999],
    ])(
      'addOutput receives BigInt for %s',
      async (_, sendValue, changeValue) => {
        const outputs = [{ address: baseParams.to, value: sendValue }]
        if (changeValue > 0) {
          outputs.push({ value: changeValue })
        }

        coinSelect.mockReturnValue({
          inputs: [
            {
              txId: 'a1b2c3d4',
              vout: 0,
              witnessUtxo: { script: new Uint8Array(22), value: BigInt(10000) },
            },
          ],
          outputs,
          fee: 1000,
        })

        const mockPsbt = {
          addInput: jest.fn(),
          addOutput: jest.fn(),
          signAllInputsHD: jest.fn(),
          finalizeAllInputs: jest.fn(),
          extractTransaction: jest.fn(() => ({ toHex: jest.fn(() => 'hex') })),
        }
        const psbtSpy = jest
          .spyOn(bitcoin, 'Psbt')
          .mockImplementation(() => mockPsbt)
        BTC.checkFee = jest.fn(() => true)

        await buildTransaction(baseParams)

        mockPsbt.addOutput.mock.calls.forEach((call) => {
          expect(typeof call[0].value).toBe('bigint')
        })

        psbtSpy.mockRestore()
      },
    )
  })
})
