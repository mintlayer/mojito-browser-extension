import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'

import { EnvVars } from '@Constants'
import BTC_ADDRESS_TYPE_MAP from './BTC.addressType'

const NETWORK = bitcoin.networks[EnvVars.BTC_NETWORK]

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => Bip39.mnemonicToSeedSync(mnemonic)

const getKeysFromSeed = (seed, algoType = BTC_ADDRESS_TYPE_MAP.legacy) => {
  const root = getBIP32Object().fromSeed(seed, NETWORK)
  const account = root.derivePath(algoType.derivationPath)
  return [account.publicKey, account.toWIF()]
}

const generateMnemonic = (entropy) => {
  const mnemonic = Bip39.entropyToMnemonic(entropy)
  return mnemonic
}

const generateKeysFromMnemonic = (mnemonic) => {
  const seed = getSeedFromMnemonic(mnemonic)
  return getKeysFromSeed(seed)
}

const generateAddr = (mnemonic, algoType = BTC_ADDRESS_TYPE_MAP.legacy) => {
  const [pubKey] = generateKeysFromMnemonic(mnemonic)
  const btcAddress = algoType.getAddressFromPubKey(pubKey)

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
  validateMnemonic,
  getWordList,
}
