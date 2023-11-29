import init, {
  make_private_key,
  public_key_from_private_key,
  sign_message,
  verify_signature,
  make_receiving_address,
  pubkey_to_string,
  make_default_account_privkey,
  make_change_address,
} from './@mintlayerlib-js/wasm_crypto.js'

const NETWORKS = {
  mainnet: 0,
  testnet: 1,
  regtest: 2,
  signet: 3,
}

export const getPrivateKeyFromMnemonic = async (mnemonic, networkType) => {
  await init()
  const networkIndex = NETWORKS[networkType]
  return make_default_account_privkey(mnemonic, networkIndex)
}

export const getPrivateKey = async () => {
  await init()
  return make_private_key()
}

export const signMessage = async (privateKey, message) => {
  await init()
  return sign_message(privateKey, message)
}

export const verifySignature = async (publicKey, signature, message) => {
  await init()
  return verify_signature(publicKey, signature, message)
}

export const getReceivingAddress = async (defAccPrivateKey, keyIndex) => {
  await init()
  return make_receiving_address(defAccPrivateKey, keyIndex)
}

export const getChangeAddress = async (defAccPrivateKey, keyIndex) => {
  await init()
  return make_change_address(defAccPrivateKey, keyIndex)
}

export const getPublicKeyFromPrivate = async (privateKey) => {
  await init()
  return public_key_from_private_key(privateKey)
}

export const getPubKeyString = async (pubkey, network) => {
  await init()
  return pubkey_to_string(pubkey, network)
}

export const getAddressFromPubKey = (pubKey, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return getPubKeyString(pubKey, networkIndex)
}

export const getWalletAddresses = async (mlPrivateKey, network) => {
  const generateAddresses = async (addressGenerator) => {
    const addresses = await Promise.all(
      Array.from({ length: 21 }, (_, i) => addressGenerator(mlPrivateKey, i)),
    )

    const publicKeys = await Promise.all(
      addresses.map((address) => getPublicKeyFromPrivate(address)),
    )

    return Promise.all(
      publicKeys.map((pubKey) => getAddressFromPubKey(pubKey, network)),
    )
  }

  const [mlReceivingAddresses, mlChangeAddresses] = await Promise.all([
    generateAddresses(getReceivingAddress),
    generateAddresses(getChangeAddress),
  ])

  return { mlReceivingAddresses, mlChangeAddresses }
}
