import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'
import { validate } from 'wallet-address-validator'
import { ECPairFactory } from 'ecpair'

import {
  generateAddr,
  generateMnemonic,
  generateKeysFromMnemonic,
  validateMnemonic,
} from './BTC'

import {
  localStorageMock,
  setLocalStorage,
} from 'src/tests/mock/localStorage/localStorage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })
setLocalStorage('networkType', 'testnet')

const ECPair = ECPairFactory(ecc)
const knownAddress = 'msPGWzYgtjeTZKsmF7hUg5qmj76wdVi6qQ'
const knownMnemonic =
  'labor plate task sniff blanket rose answer gesture time seek crowd capital'
const knownWIF = 'cQQb97816o6xoKiVtaL8AMnzQsbiAXzmEKEQE9xQSwMhDeQXZGDw'
const knownPubkey =
  '02c99ecdb433cce49ed3ce5cda347366446610134c78be6419dea6bd51addb7865'

let autoReferencedMnemonic = null
let autoReferencedaddress = null

const ENTROPY_DATA = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]

const testnetNetwork = bitcoin.networks['testnet']

/**
 * Auto reference: checks if the data it is generating matches and have be reused
 * Known data: checks if data generated in the past keeps working
 */
afterEach(() => {
  jest.restoreAllMocks()
})

test('Mnemonic Generation - auto reference', () => {
  autoReferencedMnemonic = generateMnemonic(ENTROPY_DATA)
  expect(autoReferencedMnemonic.split(' ').length).toBe(12)
})

test('Address Generation - auto reference', () => {
  autoReferencedaddress = generateAddr(autoReferencedMnemonic, testnetNetwork)
  expect(validate(autoReferencedaddress, 'btc', 'testnet')).toBeTruthy()
})

test('Keys Generation - auto reference', () => {
  const [pubKey, WIF] = generateKeysFromMnemonic(autoReferencedMnemonic)
  const generatedAddress = bitcoin.payments.p2pkh({
    pubkey: pubKey,
    network: bitcoin.networks['testnet'],
  }).address

  const keyPair = ECPair.fromWIF(WIF, bitcoin.networks['testnet'])
  const generatedAddress2 = bitcoin.payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: bitcoin.networks['testnet'],
  }).address

  expect(generatedAddress).toBe(autoReferencedaddress)
  expect(generatedAddress2).toBe(autoReferencedaddress)
})

test('Address Generation - know data', () => {
  const address = generateAddr(knownMnemonic, testnetNetwork)

  expect(address).toBe(knownAddress)
})

test('Keys Generation - know data', () => {
  const [pubKey, WIF] = generateKeysFromMnemonic(knownMnemonic)
  expect(pubKey.toString('hex')).toBe(knownPubkey)
  expect(WIF).toBe(knownWIF)
})

test('Validate Mnemonic parse', () => {
  expect(validateMnemonic('aaaa bbbb')).not.toBeTruthy()
  expect(validateMnemonic(knownMnemonic)).toBeTruthy()
})
