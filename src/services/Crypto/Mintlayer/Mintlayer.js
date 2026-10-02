/* eslint-disable max-params */
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
  encode_output_issue_nft,
  get_token_id,
  staking_pool_spend_maturity_block_count,
  SignatureHashType,
  SourceId,
  Amount,
  encode_output_token_transfer,
  sign_message_for_spending,
  verify_signature_for_spending,
  sign_challenge,
  verify_challenge,
  encode_output_token_lock_then_transfer,
} from './@mintlayerlib-js/wasm_wrappers.js'
import { batchRequestMintlayer } from '../../API/Mintlayer/Mintlayer'

const NETWORKS = {
  mainnet: 0,
  testnet: 1,
  regtest: 2,
  signet: 3,
}

const getNetworkIndex = (networkType) => {
  const networkIndex = NETWORKS[networkType]
  if (networkIndex === undefined) {
    throw new Error(`Unknown Mintlayer network type: ${networkType}`)
  }
  return networkIndex
}

export const initWasm = async () => {
  await init()
}

export const getPrivateKeyFromMnemonic = (mnemonic, networkType) => {
  const networkIndex = getNetworkIndex(networkType)
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
  const networkIndex = getNetworkIndex(networkType)
  return getPubKeyString(pubKey, networkIndex)
}

// The third argument is a COUNT of the addresses to cover (not an offset):
// it must match how many addresses were generated/discovered for the wallet,
// otherwise inputs on higher indices find no private key. An address list may
// be passed instead of a number, in which case its length is used.
export const getWalletPrivKeysList = (
  mlPrivateKey,
  network,
  countOrAddresses = 21,
) => {
  const count = Array.isArray(countOrAddresses)
    ? countOrAddresses.length
    : countOrAddresses

  const generatePrivKeys = (addressGenerator) => {
    const privKeys = Array.from({ length: count }, (_, i) =>
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

    return { addressPrivKeyPairs, publicKeys }
  }

  const receivingData = generatePrivKeys(getReceivingAddress)
  const changeData = generatePrivKeys(getChangeAddress)

  return {
    mlReceivingPrivKeys: receivingData.addressPrivKeyPairs,
    mlChangePrivKeys: changeData.addressPrivKeyPairs,
    mlReceivingPublicKeys: receivingData.publicKeys,
    mlChangePublicKeys: changeData.publicKeys,
  }
}

const checkIfAddressesUsed = async (addresses) => {
  const data = await batchRequestMintlayer({
    ids: addresses,
    type: '/address/:address',
  })
  // A per-item error is the server's normal "address unused" signal (it maps
  // to unused:true in MintlayerProvider); only request-level failures reject.
  return (data || []).map((item) => {
    if (item.error) {
      return false
    }
    return item?.transaction_history?.length > 0
  })
}

export const getWalletAddresses = async (mlPrivateKey, network, batch = 20) => {
  const generateAddresses = (addressGenerator, length, offset) => {
    const privKeys = Array.from({ length }, (_, i) =>
      addressGenerator(mlPrivateKey, i + offset),
    )

    const publicKeys = privKeys.map((privKey) =>
      getPublicKeyFromPrivate(privKey),
    )

    const addresses = publicKeys.map((pubKey) =>
      getAddressFromPubKey(pubKey, network),
    )

    return { addresses, publicKeys }
  }

  const checkAndGenerateAddresses = async (addressGenerator) => {
    const { addresses, publicKeys } = generateAddresses(
      addressGenerator,
      batch,
      0,
    )
    let allUsed = await checkIfAddressesUsed(addresses)

    while (allUsed.length > 0 && allUsed.every((used) => used)) {
      const newData = generateAddresses(
        addressGenerator,
        batch,
        addresses.length,
      )
      addresses.push(...newData.addresses)
      publicKeys.push(...newData.publicKeys)
      allUsed = await checkIfAddressesUsed(newData.addresses)
    }

    return { addresses, publicKeys }
  }

  const [receivingData, changeData] = await Promise.all([
    checkAndGenerateAddresses(getReceivingAddress),
    checkAndGenerateAddresses(getChangeAddress),
  ])

  return {
    mlReceivingAddresses: receivingData.addresses,
    mlChangeAddresses: changeData.addresses,
    mlReceivingPublicKeys: receivingData.publicKeys,
    mlChangePublicKeys: changeData.publicKeys,
  }
}

export const getEncodedOutpointSourceId = (txId) => {
  return encode_outpoint_source_id(txId, SourceId.Transaction)
}

export const getTxInput = (outpointSourceId, index) => {
  return encode_input_for_utxo(outpointSourceId, index)
}

export const getOutputs = ({
  amount,
  address,
  networkType,
  type = 'Transfer',
  lock,
  chainTip,
  tokenId,
  utxo,
}) => {
  if (type === 'LockThenTransfer' && !lock) {
    throw new Error('LockThenTransfer requires a lock')
  }

  const networkIndex = getNetworkIndex(networkType)

  const outputTypes = [
    'Transfer',
    'LockThenTransfer',
    'spendFromDelegation',
    'IssueNft',
  ]
  if (!outputTypes.includes(type)) {
    throw new Error(`Unknown output type: ${type}`)
  }

  if (
    type === 'LockThenTransfer' &&
    lock.type !== 'UntilTime' &&
    lock.type !== 'ForBlockCount'
  ) {
    throw new Error(`Unknown lock type: ${lock.type}`)
  }

  const amountInstace = amount ? Amount.from_atoms(amount) : undefined

  if (type === 'Transfer') {
    if (tokenId) {
      return encode_output_token_transfer(
        amountInstace,
        address,
        tokenId,
        networkIndex,
      )
    } else {
      return encode_output_transfer(amountInstace, address, networkIndex)
    }
  }
  if (type === 'LockThenTransfer') {
    let lockEncoded
    if (lock.type === 'UntilTime') {
      lockEncoded = encode_lock_until_time(BigInt(lock.content.timestamp))
    }
    if (lock.type === 'ForBlockCount') {
      lockEncoded = encode_lock_for_block_count(BigInt(lock.content))
    }
    if (tokenId) {
      return encode_output_token_lock_then_transfer(
        amountInstace,
        address,
        tokenId,
        lockEncoded,
        networkIndex,
      )
    } else {
      return encode_output_lock_then_transfer(
        amountInstace,
        address,
        lockEncoded,
        networkIndex,
      )
    }
  }
  if (type === 'spendFromDelegation') {
    const stakingMaturity = getStakingMaturity(chainTip, networkType)
    const encodedLockForBlock = encode_lock_for_block_count(stakingMaturity)
    return encode_output_lock_then_transfer(
      amountInstace,
      address,
      encodedLockForBlock,
      networkIndex,
    )
  }

  if (type === 'IssueNft') {
    return encode_output_issue_nft(
      utxo.utxo.token_id,
      utxo.utxo.destination,
      utxo.utxo.data.name.string,
      utxo.utxo.data.ticker.string,
      utxo.utxo.data.description.string,
      Buffer.from(utxo.utxo.data.media_hash.hex, 'hex'),
      utxo.utxo.data.creator,
      utxo.utxo.data.media_uri.string,
      utxo.utxo.data.icon_uri.string,
      utxo.utxo.data.additional_metadata_uri.string,
      BigInt(Number(chainTip)),
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
) => {
  const networkIndex = getNetworkIndex(networkType)
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
  const networkIndex = getNetworkIndex(networkType)
  return estimate_transaction_size(
    inputs,
    inputAddresses,
    outputs,
    networkIndex,
  )
}

export const getDelegationOutput = (poolId, address, networkType) => {
  const networkIndex = getNetworkIndex(networkType)
  return encode_output_create_delegation(poolId, address, networkIndex)
}

export const getStakingOutput = (amount, delegationId, networkType) => {
  const networkIndex = getNetworkIndex(networkType)
  const amountInstace = Amount.from_atoms(amount)
  return encode_output_delegate_staking(
    amountInstace,
    delegationId,
    networkIndex,
  )
}

export const getStakingMaturity = (blockHeight, networkType) => {
  const networkIndex = getNetworkIndex(networkType)
  return staking_pool_spend_maturity_block_count(
    BigInt(Number(blockHeight)),
    networkIndex,
  )
}

export const getAccountOutpointInput = (
  delegationId,
  amount,
  nonce,
  networkType,
) => {
  const networkIndex = getNetworkIndex(networkType)
  const amountInstace = Amount.from_atoms(amount)
  return encode_input_for_withdraw_from_delegation(
    delegationId,
    amountInstace,
    BigInt(Number(nonce)),
    networkIndex,
  )
}

export const signMessageForSpending = (privateKey, message) => {
  return sign_message_for_spending(privateKey, message)
}

export const verifySignatureForSpending = (publicKey, signature, message) => {
  return verify_signature_for_spending(publicKey, signature, message)
}

export const signChallenge = (privateKey, message) => {
  return sign_challenge(privateKey, message)
}

export const verifyChallenge = (
  address,
  networkType,
  signedChallenge,
  message,
) => {
  const networkIndex = getNetworkIndex(networkType)
  return verify_challenge(address, networkIndex, signedChallenge, message)
}

export const getOutputIssueNft = (
  tokenId,
  address,
  name,
  ticker,
  description,
  mediaHash,
  creator,
  mediaUri,
  iconUri,
  additionalMetadataUri,
  currentBlockHeight,
  networkType,
) => {
  const networkIndex = getNetworkIndex(networkType)
  return encode_output_issue_nft(
    tokenId,
    address,
    name,
    ticker,
    description,
    mediaHash,
    creator,
    mediaUri,
    iconUri,
    additionalMetadataUri,
    currentBlockHeight,
    networkIndex,
  )
}

export const getTokenId = (inputs, networkType) => {
  const networkIndex = getNetworkIndex(networkType)

  return get_token_id(inputs, networkIndex)
}
