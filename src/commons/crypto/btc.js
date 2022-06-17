import { BIP32Factory } from 'bip32'
import * as Bip39 from 'bip39'
import * as bitcoin from 'bitcoinjs-lib'
import * as ecc from 'tiny-secp256k1'
import { BTC_NETWORK } from '../../environmentVars'

// eslint-disable-next-line
const DERIVATION_PATH = "m/44'/0'/0'/0/0"
const NETWORK = bitcoin.networks[BTC_NETWORK]

const getBIP32Object = () => BIP32Factory(ecc)

const getSeedFromMnemonic = (mnemonic) => {
  return Bip39.mnemonicToSeedSync(mnemonic)
}
const getKeysFromSeed = (seed) => {
  const root = getBIP32Object().fromSeed(seed, NETWORK)
  const account = root.derivePath(DERIVATION_PATH)
  return [ account.publicKey, account.toWIF() ]
}
const getAddressFromPubKey = (pubkey) => bitcoin.payments.p2pkh({ pubkey, network: NETWORK }).address

const generateMnemonic = () => Bip39.generateMnemonic()

const generateKeysFromMnemonic = (mnemonic) => {
  const seed = getSeedFromMnemonic(mnemonic)
  return getKeysFromSeed(seed)
}

const generateAddr = (mnemonic) => {
  const [ pubKey ] = generateKeysFromMnemonic(mnemonic)
  const btcAddress = getAddressFromPubKey(pubKey)

  return btcAddress
}

export { generateAddr, generateMnemonic, generateKeysFromMnemonic, getSeedFromMnemonic }
