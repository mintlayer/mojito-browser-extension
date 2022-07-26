import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'

import { EnvVars } from '@Constants'

// eslint-disable-next-line
const DERIVATION_PATH = "m/44'/0'/0'/0/0"
const NETWORK = bitcoin.networks[EnvVars.BTC_NETWORK]

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => Bip39.mnemonicToSeedSync(mnemonic)

const getKeysFromSeed = (seed) => {
  const root = getBIP32Object().fromSeed(seed, NETWORK)
  const account = root.derivePath(DERIVATION_PATH)
  return [account.publicKey, account.toWIF()]
}
const getAddressFromPubKey = (pubkey) =>
  bitcoin.payments.p2pkh({ pubkey, network: NETWORK }).address

const generateMnemonic = () => Bip39.generateMnemonic()

const generateKeysFromMnemonic = (mnemonic) => {
  const seed = getSeedFromMnemonic(mnemonic)
  return getKeysFromSeed(seed)
}

const generateAddr = (mnemonic) => {
  const [pubKey] = generateKeysFromMnemonic(mnemonic)
  const btcAddress = getAddressFromPubKey(pubKey)

  return btcAddress
}

const validateMnemonic = (mnemonic) => Bip39.validateMnemonic(mnemonic)

const getWordList = () => Bip39.wordlists[Bip39.getDefaultWordlist()]

export {
  generateAddr,
  generateMnemonic,
  generateKeysFromMnemonic,
  getSeedFromMnemonic,
  getKeysFromSeed,
  getAddressFromPubKey,
  validateMnemonic,
  getWordList,
}
