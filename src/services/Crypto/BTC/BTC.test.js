import {
  generateMnemonic,
  validateMnemonic,
  getSeedFromMnemonic,
  getWordList,
} from './BTC'

import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'
import { LocalStorageService } from '@Storage'

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
LocalStorageService.setItem('networkType', 'testnet')

// Test constants
const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
const KNOWN_MNEMONIC =
  'labor plate task sniff blanket rose answer gesture time seek crowd capital'
const INVALID_MNEMONIC = 'invalid mnemonic phrase that should not validate'

describe('BTC Crypto Functions', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('generateMnemonic should create valid 12-word mnemonic', () => {
    const mnemonic = generateMnemonic(ENTROPY_DATA)
    const words = mnemonic.split(' ')

    expect(words).toHaveLength(12)
    expect(typeof mnemonic).toBe('string')
    expect(mnemonic.length).toBeGreaterThan(0)
  })

  test('validateMnemonic should validate correct mnemonic', () => {
    expect(validateMnemonic(KNOWN_MNEMONIC)).toBe(true)
  })

  test('validateMnemonic should reject invalid mnemonic', () => {
    expect(validateMnemonic(INVALID_MNEMONIC)).toBe(false)
    expect(validateMnemonic('')).toBe(false)
    expect(validateMnemonic('single')).toBe(false)
  })

  test('getSeedFromMnemonic should generate seed buffer', () => {
    const seed = getSeedFromMnemonic(KNOWN_MNEMONIC)

    expect(seed).toBeInstanceOf(Buffer)
    expect(seed.length).toBe(64) // BIP39 seeds are 64 bytes
  })

  test('getSeedFromMnemonic should be deterministic', () => {
    const seed1 = getSeedFromMnemonic(KNOWN_MNEMONIC)
    const seed2 = getSeedFromMnemonic(KNOWN_MNEMONIC)

    expect(seed1.equals(seed2)).toBe(true)
  })

  test('getWordList should return BIP39 word list', () => {
    const wordList = getWordList()

    expect(Array.isArray(wordList)).toBe(true)
    expect(wordList).toHaveLength(2048) // BIP39 standard word list length
    expect(wordList).toContain('abandon') // First word in BIP39 list
    expect(wordList).toContain('zoo') // Last word in BIP39 list
  })

  test('generated mnemonic should be valid', () => {
    const mnemonic = generateMnemonic(ENTROPY_DATA)
    expect(validateMnemonic(mnemonic)).toBe(true)
  })
})

// Test ECC library functionality with delayed imports + cache clearing
test('ECC library should work with BIP32Factory', async () => {
  const { BIP32Factory } = await import('bip32')
  const ecc = await import('@bitcoinerlab/secp256k1')

  expect(() => {
    const bip32 = BIP32Factory(ecc)
    expect(bip32).toBeDefined()
  }).not.toThrow()
})

test('ECC library should work with ECPairFactory', async () => {
  const ECPairModule = await import('ecpair')
  const ECPairFactory = ECPairModule.ECPairFactory
  const ecc = await import('@bitcoinerlab/secp256k1')

  expect(() => {
    const ECPair = ECPairFactory(ecc)
    expect(ECPair).toBeDefined()
  }).not.toThrow()
})
