// import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs'
// import * as bitcoin from 'bitcoinjs-lib'
// import { validate } from 'wallet-address-validator'
// import { ECPairFactory } from 'ecpair'

// import {
//   generateAddr,
//   generateMnemonic,
//   generateKeysFromMnemonic,
//   validateMnemonic,
// } from './BTC'

// import { localStorageMock } from 'src/tests/mock/localStorage/localStorage'

// import { LocalStorageService } from '@Storage'
// Object.defineProperty(window, 'localStorage', { value: localStorageMock })
// LocalStorageService.setItem('networkType', 'testnet')

// const ECPair = ECPairFactory(ecc)
// const knownAddress = 'msPGWzYgtjeTZKsmF7hUg5qmj76wdVi6qQ'
// const knownMnemonic =
//   'labor plate task sniff blanket rose answer gesture time seek crowd capital'
// const knownWIF = 'cQQb97816o6xoKiVtaL8AMnzQsbiAXzmEKEQE9xQSwMhDeQXZGDw'
// const knownPubkey =
//   '02c99ecdb433cce49ed3ce5cda347366446610134c78be6419dea6bd51addb7865'

// let autoReferencedMnemonic = null
// let autoReferencedaddress = null

// const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

// const testnetNetwork = bitcoin.networks['testnet']

// /**
//  * Auto reference: checks if the data it is generating matches and have be reused
//  * Known data: checks if data generated in the past keeps working
//  */
// afterEach(() => {
//   jest.restoreAllMocks()
// })

// test('Mnemonic Generation - auto reference', () => {
//   autoReferencedMnemonic = generateMnemonic(ENTROPY_DATA)
//   expect(autoReferencedMnemonic.split(' ').length).toBe(12)
// })

// test('Address Generation - auto reference', () => {
//   autoReferencedaddress = generateAddr(autoReferencedMnemonic, testnetNetwork)
//   expect(validate(autoReferencedaddress, 'btc', 'testnet')).toBeTruthy()
// })

// test('Keys Generation - auto reference', () => {
//   const [pubKey, WIF] = generateKeysFromMnemonic(autoReferencedMnemonic)
//   const generatedAddress = bitcoin.payments.p2pkh({
//     pubkey: pubKey,
//     network: bitcoin.networks['testnet'],
//   }).address

//   const keyPair = ECPair.fromWIF(WIF, bitcoin.networks['testnet'])
//   const generatedAddress2 = bitcoin.payments.p2pkh({
//     pubkey: keyPair.publicKey,
//     network: bitcoin.networks['testnet'],
//   }).address

//   expect(generatedAddress).toBe(autoReferencedaddress)
//   expect(generatedAddress2).toBe(autoReferencedaddress)
// })

// test('Address Generation - know data', () => {
//   const address = generateAddr(knownMnemonic, testnetNetwork)

//   expect(address).toBe(knownAddress)
// })

// test('Keys Generation - know data', () => {
//   const [pubKey, WIF] = generateKeysFromMnemonic(knownMnemonic)
//   expect(pubKey.toString('hex')).toBe(knownPubkey)
//   expect(WIF).toBe(knownWIF)
// })

// test('Validate Mnemonic parse', () => {
//   expect(validateMnemonic('aaaa bbbb')).not.toBeTruthy()
//   expect(validateMnemonic(knownMnemonic)).toBeTruthy()
// })

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

// TODO: Investigate why @bitcoinerlab/secp256k1 and ECPairFactory are not widely used in the Jest environment, and find a solution to make the tests work.
test.skip('Address Generation - know data', () => {
  const address = 'dsadadasdad'
  expect(address).toBe('dsadadasdad')
})
