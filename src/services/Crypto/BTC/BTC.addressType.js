/* eslint-disable quotes */
import * as bitcoin from 'bitcoinjs-lib'
import { Electrum } from '@APIs'

const getLegacyAddress = (pubkey, network) =>
  bitcoin.payments.p2pkh({ pubkey, network }).address

const getP2shAddress = (pubkey, network) =>
  bitcoin.payments.p2sh({
    redeem: bitcoin.payments.p2wpkh({ pubkey, network }),
  }).address

const getNativeSegwitAddress = (pubkey, network) =>
  bitcoin.payments.p2wpkh({ pubkey, network }).address

// Get derivation path based on wallet type
const getDerivationPath = (
  addressIndex = 0,
  change = 0,
  walletType = 'nativeSegwit',
) => {
  const basePaths = {
    legacy: "m/44'/0'/0'",
    p2sh: "m/49'/0'/0'",
    nativeSegwit: "m/84'/0'/0'",
  }
  return `${basePaths[walletType]}/${change}/${addressIndex}`
}

// Get address generator function based on wallet type
const getAddressGenerator = (walletType) => {
  const generators = {
    legacy: getLegacyAddress,
    p2sh: getP2shAddress,
    nativeSegwit: getNativeSegwitAddress,
  }
  return generators[walletType] || getNativeSegwitAddress
}

const checkBtcAddressesUnused = async (addresses) => {
  try {
    if (!Array.isArray(addresses) || addresses.length === 0) return false
    const toCheck = addresses.length > 3 ? addresses.slice(-3) : addresses

    const results = await Promise.all(
      toCheck.map((address) => Electrum.getAddress(address)),
    )

    return results.every((data) => {
      let parsedData
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data
      } catch {
        return false
      }
      const chainTx = parsedData?.chain_stats?.tx_count || 0
      const memTx = parsedData?.mempool_stats?.tx_count || 0
      return chainTx + memTx === 0
    })
  } catch (e) {
    return false
  }
}

// TODO: generate addresses till last 3 are unused
export const getBtcWalletAddresses = async (
  hdWallet,
  network,
  batch = 20,
  walletType = 'nativeSegwit',
) => {
  const addressGenerator = getAddressGenerator(walletType)
  const privateKeys = {}

  const generateAddresses = (isChange, length, offset) => {
    const change = isChange ? 1 : 0
    const addresses = []

    for (let i = 0; i < length; i++) {
      const addressIndex = i + offset
      const derivationPath = getDerivationPath(addressIndex, change, walletType)
      const child = hdWallet.derivePath(derivationPath)
      const pubkey = child.publicKey
      const address = addressGenerator(pubkey, network)

      addresses.push({
        index: addressIndex,
        derivationPath,
        address,
        pubkey,
        privateKey: child.privateKey,
        type: walletType,
        isChange,
      })
      privateKeys[address] = child.toWIF()
    }
    return addresses
  }

  const checkAndGenerateAddresses = async (isChange) => {
    const addresses = generateAddresses(isChange, batch, 0)
    let addressStrings = addresses.map((addr) => addr.address)
    let lastThreeUnused = await checkBtcAddressesUnused(addressStrings)

    while (!lastThreeUnused && addresses.length < 1000) {
      const newAddresses = generateAddresses(isChange, batch, addresses.length)
      addresses.push(...newAddresses)
      addressStrings = addresses.map((addr) => addr.address)
      lastThreeUnused = await checkBtcAddressesUnused(addressStrings)
    }

    return addresses
  }

  const [btcReceivingAddresses, btcChangeAddresses] = await Promise.all([
    checkAndGenerateAddresses(false), // receiving addresses
    checkAndGenerateAddresses(true), // change addresses
  ])

  return { btcReceivingAddresses, btcChangeAddresses, privateKeys }
}

// Address type configuration
const BTC_ADDRESS_TYPE_MAP = {
  legacy: {
    derivationPath: "m/44'/0'/0'/0/0",
    getAddresses: getBtcWalletAddresses,
  },
  p2sh: {
    derivationPath: "m/49'/0'/0'/0/0",
    getAddresses: getBtcWalletAddresses,
  },
  nativeSegwit: {
    derivationPath: "m/84'/0'/0'/0/0",
    getAddresses: getBtcWalletAddresses,
  },
}

const BTC_ADDRESS_TYPE_ENUM = {
  LEGACY: 'legacy',
  P2SH: 'p2sh',
  NATIVE_SEGWIT: 'nativeSegwit',
}

const BTC_ADDRESS_UTILS = {
  getDerivationPath,
  getBtcWalletAddresses,
  getAddressGenerator,
}

export { BTC_ADDRESS_TYPE_ENUM, BTC_ADDRESS_UTILS }
export default BTC_ADDRESS_TYPE_MAP
