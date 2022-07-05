import { validate } from 'wallet-address-validator'
import { ECPairFactory } from 'ecpair'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'

import {
  generateAddr,
  generateMnemonic,
  generateKeysFromMnemonic,
  calculateBalanceFromUtxoList,
  convertSatoshiToBtc,
  getParsedTransactions,
  validateMnemonic,
} from './btc'

import rawTransactions from './testTransactions.json'

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

test('Calculate Balance From Utxo List', () => {
  const utxoListSamples = [
    {
      txid: '6106cf34a6b0fd1d4f81bc7644237adb1f40a7da0cafff7c90212c053e63ee6e',
      vout: 1,
      status: {},
      value: 881771,
    },
    {
      txid: '6ec6b313788063402c7404b00433b7a30bb511fb2f73429097e0cbc4dea3be33',
      vout: 0,
      status: {},
      value: 2000000,
    },
    {
      txid: '0aadaf5f3a267a409a24c5adfc50ceb7a28943910da02247be7608c5934a3217',
      vout: 1,
      status: {},
      value: 50000000,
    },
    {
      txid: 'd9d587c9f77996e5618141a564d46f3bb7c92a7cdd8cbe9142bc43eb18a63887',
      vout: 0,
      status: {},
      value: 13999000,
    },
    {
      txid: '99845fd840ad2cc4d6f93fafb8b072d188821f55d9298772415175c456f3077d',
      vout: 0,
      status: {},
      value: 50000,
    },
    {
      txid: '164f86f0226afdda9d431e58e94b48ac4bd382b7c72b8814d6eb502678e32268',
      vout: 0,
      status: {},
      value: 10000,
    },
  ]
  const balance = '66940771'
  const satoshiAmount = calculateBalanceFromUtxoList(utxoListSamples)
  expect(satoshiAmount).toBe(balance)
})

test('Satoshi to BTC', () => {
  const satoshi1 = 100_000_000
  const balance1 = 1
  const satoshi2 = 1_000_000_000
  const balance2 = 10
  const satoshi3 = 1_000
  const balance3 = 0.00001

  const resultBalance1 = convertSatoshiToBtc(satoshi1)
  const resultBalance2 = convertSatoshiToBtc(satoshi2)
  const resultBalance3 = convertSatoshiToBtc(satoshi3)

  expect(resultBalance1).toBe(balance1)
  expect(resultBalance2).toBe(balance2)
  expect(resultBalance3).toBe(balance3)
})

test('Transactions parse', () => {
  const address = '2MyEpfT2SxQjVRipzTEzxSRPyerpoENmAom'
  const randomIndex = Math.floor(Math.random() * (rawTransactions.length - 1))

  const parsedTransactions = getParsedTransactions(rawTransactions, address)

  const inTransactionsAmount = parsedTransactions.reduce(
    (acc, item) => (item.direction === 'in' ? acc + 1 : acc),
    0,
  )

  expect(parsedTransactions.length).toBe(parsedTransactions.length)
  expect(inTransactionsAmount).toBe(24)

  expect(typeof parsedTransactions[randomIndex].txid).toBe('string')
  expect(typeof parsedTransactions[randomIndex].direction).toBe('string')
  expect(typeof parsedTransactions[randomIndex].value).toBe('number')
  expect(parsedTransactions[randomIndex].otherPart.length).toBeGreaterThan(0)
})

test('Validate Mnemonic parse', () => {
  expect(validateMnemonic('aaaa bbbb')).not.toBeTruthy()
  expect(validateMnemonic(knownMnemonic)).toBeTruthy()
})
