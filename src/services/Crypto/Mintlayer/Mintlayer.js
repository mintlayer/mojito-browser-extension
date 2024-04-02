import init, {
  public_key_from_private_key,
  make_receiving_address,
  pubkey_to_pubkeyhash_address,
  make_default_account_privkey,
  make_change_address,
  encode_outpoint_source_id,
  encode_input_for_utxo,
  encode_input_for_withdraw_from_delegation,
  encode_output_transfer,
  encode_transaction,
  encode_witness,
  encode_signed_transaction,
  estimate_transaction_size,
  encode_lock_until_time,
  encode_output_lock_then_transfer,
  encode_lock_for_block_count,
  encode_output_create_delegation,
  encode_output_delegate_staking,
  staking_pool_spend_maturity_block_count,
  SignatureHashType,
  SourceId,
  Amount,
} from './@mintlayerlib-js/wasm_wrappers.js'

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

export const getPrivateKeyFromMnemonic = (mnemonic, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return make_default_account_privkey(mnemonic, networkIndex)
}

export const getReceivingAddress = (defAccPrivateKey, keyIndex) => {
  return make_receiving_address(defAccPrivateKey, keyIndex)
}

export const getChangeAddress = (defAccPrivateKey, keyIndex) => {
  return make_change_address(defAccPrivateKey, keyIndex)
}

export const getPublicKeyFromPrivate = (privateKey) => {
  return public_key_from_private_key(privateKey)
}

export const getPubKeyString = (pubkey, network) => {
  return pubkey_to_pubkeyhash_address(pubkey, network)
}

export const getAddressFromPubKey = (pubKey, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return getPubKeyString(pubKey, networkIndex)
}

export const getWalletPrivKeysList = (mlPrivateKey, network, offset = 21) => {
  const generatePrivKeys = (addressGenerator) => {
    const privKeys = Array.from({ length: offset }, (_, i) =>
      addressGenerator(mlPrivateKey, i),
    )

    const publicKeys = privKeys.map((privKey) =>
      getPublicKeyFromPrivate(privKey),
    )

    const addresses = publicKeys.map((pubKey) =>
      getAddressFromPubKey(pubKey, network),
    )

    const addressPrivKeyPairs = addresses.reduce((acc, address, index) => {
      acc[address] = privKeys[index]
      return acc
    }, {})

    return addressPrivKeyPairs
  }

  const [mlReceivingPrivKeys, mlChangePrivKeys] = [
    generatePrivKeys(getReceivingAddress),
    generatePrivKeys(getChangeAddress),
  ]

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
  const generateAddresses = (addressGenerator) => {
    const privKeys = Array.from({ length: offset }, (_, i) =>
      addressGenerator(mlPrivateKey, i),
    )

    const publicKeys = privKeys.map((address) =>
      getPublicKeyFromPrivate(address),
    )

    return publicKeys.map((pubKey) => getAddressFromPubKey(pubKey, network))
  }

  const checkAndGenerateAddresses = async (addressGenerator) => {
    let addresses = generateAddresses(addressGenerator)
    let allUsed = await Promise.all(
      addresses.map((address) => checkIfAddressUsed(address)),
    )

    while (allUsed.every((used) => used)) {
      offset += 20
      addresses = generateAddresses(addressGenerator)
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
    if (i === addresses.length - 1) {
      return addresses[i]
    }
  }
}

export const getEncodedOutpointSourceId = (txId) => {
  return encode_outpoint_source_id(txId, SourceId.Transaction)
}

export const getTxInput = (outpointSourceId, index) => {
  return encode_input_for_utxo(outpointSourceId, index)
}

export const getOutputs = async ({
  amount,
  address,
  networkType,
  type = 'Transfer',
  lock,
}) => {
  if (type === 'LockThenTransfer' && !lock) {
    throw new Error('LockThenTransfer requires a lock')
  }

  const amountInstace = Amount.from_atoms(amount)

  const networkIndex = NETWORKS[networkType]
  if (type === 'Transfer') {
    return encode_output_transfer(amountInstace, address, networkIndex)
  }
  if (type === 'LockThenTransfer') {
    let lockEncoded
    if (lock.UntilTime) {
      lockEncoded = encode_lock_until_time(BigInt(lock.UntilTime.timestamp))
    }
    if (lock.ForBlockCount) {
      lockEncoded = encode_lock_for_block_count(BigInt(lock.ForBlockCount))
    }
    return encode_output_lock_then_transfer(
      amountInstace,
      address,
      lockEncoded,
      networkIndex,
    )
  }
  if (type === 'spendFromDelegation') {
    const chainTip = await Mintlayer.getChainTip()
    const stakingMaturity = getStakingMaturity(
      JSON.parse(chainTip).block_height,
      networkType,
    )
    const encodedLockForBlock = encode_lock_for_block_count(stakingMaturity)
    return encode_output_lock_then_transfer(
      amountInstace,
      address,
      encodedLockForBlock,
      networkIndex,
    )
  }
}

export const getTransaction = (inputs, outputs) => {
  const flags = BigInt(0)
  return encode_transaction(inputs, outputs, flags)
}

export const getEncodedWitness = (
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

export const getEncodedSignedTransaction = (transaction, witness) => {
  return encode_signed_transaction(transaction, witness)
}

export const getEstimatetransactionSize = (
  inputs,
  inputAddresses,
  outputs,
  networkType,
) => {
  const networkIndex = NETWORKS[networkType]
  return estimate_transaction_size(
    inputs,
    inputAddresses,
    outputs,
    networkIndex,
  )
}

export const getDelegationOutput = (poolId, address, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return encode_output_create_delegation(poolId, address, networkIndex)
}

export const getStakingOutput = (amount, delegationId, networkType) => {
  const networkIndex = NETWORKS[networkType]
  const amountInstace = Amount.from_atoms(amount)
  return encode_output_delegate_staking(
    amountInstace,
    delegationId,
    networkIndex,
  )
}

export const getStakingMaturity = (blockHeight, networkType) => {
  const networkIndex = NETWORKS[networkType]
  return staking_pool_spend_maturity_block_count(
    BigInt(Number(blockHeight)),
    networkIndex,
  )
}

export const getAccountOutpointInput = (
  delegationId,
  amount,
  nonce,
  networType,
) => {
  const networkIndex = NETWORKS[networType]
  const amountInstace = Amount.from_atoms(amount)
  return encode_input_for_withdraw_from_delegation(
    delegationId,
    amountInstace,
    BigInt(Number(nonce)),
    networkIndex,
  )
}
