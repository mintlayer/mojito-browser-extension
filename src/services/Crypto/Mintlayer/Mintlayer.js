import init, {
  make_private_key,
  public_key_from_private_key,
  sign_message,
  verify_signature,
  make_default_account_pubkey,
  make_receiving_address,
  pubkey_to_string,
} from './@mintlayerlib-js/wasm_crypto.js'

const NETWORKS = {
  mainnet: 0,
  testnet: 1,
  regtest: 2,
  signet: 3,
}

export const getPrivateKey = async () => {
  await init()
  return make_private_key()
}

export const getPublicKeyFromPrivate = async (privateKey) => {
  await init()
  return public_key_from_private_key(privateKey)
}

export const signMessage = async (privateKey, message) => {
  await init()
  return sign_message(privateKey, message)
}

export const verifySignature = async (publicKey, signature, message) => {
  await init()
  return verify_signature(publicKey, signature, message)
}

export const getDefaultAccountPubkey = async (mnemonic) => {
  await init()
  return make_default_account_pubkey(mnemonic)
}

export const getReceivingAddress = async (defAccPublicKey, keyIndex) => {
  await init()
  return make_receiving_address(defAccPublicKey, keyIndex)
}

export const getPubKeyString = async (pubkey, network) => {
  await init()
  return pubkey_to_string(pubkey, network)
}

export const getAddressFromPubKey = (pubKey, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return getPubKeyString(pubKey, networkIndex)
}
