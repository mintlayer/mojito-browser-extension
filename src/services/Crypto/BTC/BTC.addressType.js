import { EnvVars } from '@Constants'
import * as bitcoin from 'bitcoinjs-lib'

const NETWORK = bitcoin.networks[EnvVars.BTC_NETWORK]

const getLegacyAddress = (pubkey) =>
  bitcoin.payments.p2pkh({ pubkey, network: NETWORK }).address

const getP2shAddress = (pubkey) =>
  bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey, network: NETWORK }),
  }).address

const getNativeSegwitAddress = (pubkey) =>
  bitcoin.payments.p2wpkh({ pubkey, network: NETWORK }).address

const BTC_ADDRESS_TYPE_MAP = {
  legacy: {
    // * mainnet: 1address, testnet: maddress
    // eslint-disable-next-line quotes
    derivationPath: "m/44'/0'/0'/0",
    getAddressFromPubKey: getLegacyAddress,
  },
  p2sh: {
    // * mainnet: 3address, testnet: 2address
    // eslint-disable-next-line quotes
    derivationPath: "m/49'/0'/0'/0",
    getAddressFromPubKey: getP2shAddress,
  },
  nativeSegwit: {
    // * mainnet: bc1address, testnet: tb1address
    // eslint-disable-next-line quotes
    derivationPath: "m/84'/0'/0'/0",
    getAddressFromPubKey: getNativeSegwitAddress,
  },
}

const BTC_ADDRESS_TYPE_ENUM = {
  LEGACY: 'legacy',
  P2SH: 'p2sh',
  NATIVE_SEGWIT: 'nativeSegwit',
}

export { BTC_ADDRESS_TYPE_ENUM }
export default BTC_ADDRESS_TYPE_MAP
