import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as ecc from '@bitcoinerlab/secp256k1'
import { BTC } from '@Helpers'

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => Bip39.mnemonicToSeedSync(mnemonic)

const getHDWalletFromSeed = (seed) => {
  const root = getBIP32Object().fromSeed(seed, BTC.getNetwork())
  return root
}

const generateMnemonic = (entropy) => {
  const mnemonic = Bip39.entropyToMnemonic(entropy)
  return mnemonic
}

const validateMnemonic = (mnemonic) => Bip39.validateMnemonic(mnemonic)
const getWordList = () => Bip39.wordlists[Bip39.getDefaultWordlist()]

export {
  generateMnemonic,
  getSeedFromMnemonic,
  getHDWalletFromSeed,
  validateMnemonic,
  getWordList,
}
