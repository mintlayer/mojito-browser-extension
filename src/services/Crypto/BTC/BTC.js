import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as ecc from 'tiny-secp256k1'
import * as bitcoin from 'bitcoinjs-lib'

import { EnvVars } from '@Constants'
import BTC_ADDRESS_TYPE_MAP from './BTC.addressType'

const NETWORK = bitcoin.networks[EnvVars.BTC_NETWORK]

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => Bip39.mnemonicToSeedSync(mnemonic)

const getWalletFromSeed = (seed) => getBIP32Object().fromSeed(seed, NETWORK)

const generateMnemonic = () => Bip39.generateMnemonic()

const generateKeysFromMnemonic = (mnemonic) => {
  const seed = getSeedFromMnemonic(mnemonic)
  return getWalletFromSeed(seed)
}

const deriveWallet = (wallet, path, index) =>
  wallet.derivePath(path).derive(index)

const generateAddr = (
  mnemonic,
  algoType = BTC_ADDRESS_TYPE_MAP.legacy,
  index = 0,
) => {
  const wallet = generateKeysFromMnemonic(mnemonic)
  const { publicKey } = deriveWallet(wallet, algoType.derivationPath, index)
  const btcAddress = algoType.getAddressFromPubKey(publicKey)
  return btcAddress
}

const validateMnemonic = (mnemonic) => Bip39.validateMnemonic(mnemonic)

const getWordList = () => Bip39.wordlists[Bip39.getDefaultWordlist()]

export {
  generateAddr,
  generateMnemonic,
  generateKeysFromMnemonic,
  getSeedFromMnemonic,
  getWalletFromSeed,
  validateMnemonic,
  getWordList,
  deriveWallet,
}
