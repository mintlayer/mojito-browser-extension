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
    derivationPath: "m/44'/0'/0'/0/0",
    getAddressFromPubKey: getLegacyAddress,
  },
  p2sh: {
    derivationPath: "m/49'/0'/0'/0/0",
    getAddressFromPubKey: getP2shAddress,
  },
  nativeSegwit: {
    derivationPath: "m/48'/0'/0'/0/0",
    getAddressFromPubKey: getNativeSegwitAddress,
  },
}

export default BTC_ADDRESS_TYPE_MAP
