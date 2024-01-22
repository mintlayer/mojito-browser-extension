import init, {
  public_key_from_private_key,
  make_receiving_address,
  pubkey_to_string,
  make_default_account_privkey,
  make_change_address,
  encode_outpoint_source_id,
  encode_input_for_utxo,
  encode_output_transfer,
  encode_transaction,
  encode_witness,
  encode_signed_transaction,
  estimate_transaction_size,
  SignatureHashType,
  SourceId,
} from './@mintlayerlib-js/wasm_crypto.js'

import { Mintlayer } from '@APIs'

const NETWORKS = {
  mainnet: 0,
  testnet: 1,
  regtest: 2,
  signet: 3,
}

export const initWasm = async () => {
  await init()
}

export const getPrivateKeyFromMnemonic = async (mnemonic, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return make_default_account_privkey(mnemonic, networkIndex)
}

export const getReceivingAddress = async (defAccPrivateKey, keyIndex) => {
  return make_receiving_address(defAccPrivateKey, keyIndex)
}

export const getChangeAddress = async (defAccPrivateKey, keyIndex) => {
  return make_change_address(defAccPrivateKey, keyIndex)
}

export const getPublicKeyFromPrivate = async (privateKey) => {
  return public_key_from_private_key(privateKey)
}

export const getPubKeyString = async (pubkey, network) => {
  return pubkey_to_string(pubkey, network)
}

export const getAddressFromPubKey = (pubKey, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return getPubKeyString(pubKey, networkIndex)
}

export const getWalletPrivKeysList = async (
  mlPrivateKey,
  network,
  offset = 21,
) => {
  const generatePrivKeys = async (addressGenerator) => {
    const privKeys = await Promise.all(
      Array.from({ length: offset }, (_, i) =>
        addressGenerator(mlPrivateKey, i),
      ),
    )

    const publicKeys = await Promise.all(
      privKeys.map((privKey) => getPublicKeyFromPrivate(privKey)),
    )

    const addresses = await Promise.all(
      publicKeys.map((pubKey) => getAddressFromPubKey(pubKey, network)),
    )

    const addressPrivKeyPairs = addresses.reduce((acc, address, index) => {
      acc[address] = privKeys[index]
      return acc
    }, {})

    return addressPrivKeyPairs
  }

  const [mlReceivingPrivKeys, mlChangePrivKeys] = await Promise.all([
    generatePrivKeys(getReceivingAddress),
    generatePrivKeys(getChangeAddress),
  ])

  return { mlReceivingPrivKeys, mlChangePrivKeys }
}

const checkIfAddressUsed = async (address) => {
  const addressTransaction = await Mintlayer.getWalletTransactions([address])
  if (addressTransaction.length > 0) {
    return true
  }
  return false
}

export const getWalletAddresses = async (
  mlPrivateKey,
  network,
  offset = 21,
) => {
  const generateAddresses = async (addressGenerator) => {
    const privKeys = await Promise.all(
      Array.from({ length: offset }, (_, i) =>
        addressGenerator(mlPrivateKey, i),
      ),
    )

    const publicKeys = await Promise.all(
      privKeys.map((address) => getPublicKeyFromPrivate(address)),
    )

    return Promise.all(
      publicKeys.map((pubKey) => getAddressFromPubKey(pubKey, network)),
    )
  }

  const checkAndGenerateAddresses = async (addressGenerator) => {
    let addresses = await generateAddresses(addressGenerator)
    let allUsed = await Promise.all(
      addresses.map((address) => checkIfAddressUsed(address)),
    )

    while (allUsed.every((used) => used)) {
      offset += 20
      addresses = await generateAddresses(addressGenerator)
      allUsed = await Promise.all(
        addresses.map((address) => checkIfAddressUsed(address)),
      )
    }

    return addresses
  }

  const [mlReceivingAddresses, mlChangeAddresses] = await Promise.all([
    checkAndGenerateAddresses(getReceivingAddress),
    checkAndGenerateAddresses(getChangeAddress),
  ])

  return { mlReceivingAddresses, mlChangeAddresses }
}

export const getUnusedAddress = async (addresses) => {
  for (let i = 0; i < addresses.length; i++) {
    const isUsed = await checkIfAddressUsed(addresses[i])
    if (!isUsed) {
      return addresses[i]
    }
  }
  return null
}

export const getEncodedOutpointSourceId = async (txId) => {
  return encode_outpoint_source_id(txId, SourceId.Transaction)
}

export const getTxInput = async (outpointSourceId, index) => {
  return encode_input_for_utxo(outpointSourceId, index)
}

export const getOutputs = async (amount, address, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return encode_output_transfer(amount, address, networkIndex)
}

export const getTransaction = async (inputs, outputs) => {
  const flags = BigInt(0)
  return encode_transaction(inputs, outputs, flags)
}

export const getEncodedWitness = async (
  privateKey,
  address,
  transaction,
  inputs,
  index,
  networkType,
  // eslint-disable-next-line max-params
) => {
  const networkIndex = NETWORKS[networkType]
  return encode_witness(
    SignatureHashType.ALL,
    privateKey,
    address,
    transaction,
    inputs,
    index,
    networkIndex,
  )
}

export const getEncodedSignedTransaction = async (transaction, witness) => {
  return encode_signed_transaction(transaction, witness)
}

export const getEstimatetransactionSize = async (inputs, optUtxos, outputs) => {
  return estimate_transaction_size(inputs, optUtxos, outputs)
}
