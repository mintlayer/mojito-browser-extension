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

const ECPair = ECPairFactory(ecc)
const knownAddress = 'msPGWzYgtjeTZKsmF7hUg5qmj76wdVi6qQ'
const knownMnemonic =
  'labor plate task sniff blanket rose answer gesture time seek crowd capital'
const knownWIF = 'cQQb97816o6xoKiVtaL8AMnzQsbiAXzmEKEQE9xQSwMhDeQXZGDw'
const knownPubkey =
  '02c99ecdb433cce49ed3ce5cda347366446610134c78be6419dea6bd51addb7865'

let autoReferencedMnemonic = null
let autoReferencedaddress = null

/**
 * Auto reference: checks if the data it is generating matches and have be reused
 * Known data: checks if data generated in the past keeps working
 */

test('Mnemonic Generation - auto reference', () => {
  autoReferencedMnemonic = generateMnemonic()
  expect(autoReferencedMnemonic.split(' ').length).toBe(12)
})

test('Address Generation - auto reference', () => {
  autoReferencedaddress = generateAddr(autoReferencedMnemonic)
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
  const address = generateAddr(knownMnemonic)

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
