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

// const checkIfAddressUsed = async (address, network) => {
//   try {
//     const addressData = await Mintlayer.getAddressData(address, network)
//     const data = JSON.parse(addressData)
//     if (data.transaction_history.length > 0) {
//       return true
//     }
//     return false
//   } catch (e) {
//     return false
//   }
// }

const checkIfAddressesUsed = async (addresses, network) => {
  const res = await fetch('https://api.mintini.app/batch_data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: addresses,
      type: '/address/:txid',
      network: network === 'mainnet' ? 0 : 1,
    }),
  })
  const data = await res.json()
  return data.results.map((item) => {
    if (item.error) {
      return false
    }
    const parsedData = item
    return parsedData.transaction_history.length > 0
  })
}

export const getWalletAddresses = async (mlPrivateKey, network, batch = 20) => {
  const generateAddresses = (addressGenerator, length, offset) => {
    const privKeys = Array.from({ length }, (_, i) =>
      addressGenerator(mlPrivateKey, i + offset),
    )

    const publicKeys = privKeys.map((address) =>
      getPublicKeyFromPrivate(address),
    )

    return publicKeys.map((pubKey) => getAddressFromPubKey(pubKey, network))
  }

  const checkAndGenerateAddresses = async (addressGenerator) => {
    const addresses = generateAddresses(addressGenerator, batch, 0)
    let allUsed = await checkIfAddressesUsed(addresses, network)

    while (allUsed.every((used) => used)) {
      addresses.push(
        ...generateAddresses(addressGenerator, batch, addresses.length),
      )
      allUsed = await checkIfAddressesUsed(addresses, network)
    }

    return addresses
  }

  const [mlReceivingAddresses, mlChangeAddresses] = await Promise.all([
    checkAndGenerateAddresses(getReceivingAddress),
    checkAndGenerateAddresses(getChangeAddress),
  ])

  return { mlReceivingAddresses, mlChangeAddresses }
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

  console.log('{\n' +
    '  amount,\n' +
    '  address,\n' +
    '  networkType,\n' +
    '  type = \'Transfer\',\n' +
    '  lock,\n' +
    '  chainTip,\n' +
    '  tokenId,\n' +
    '  utxo,\n' +
    '}', {
    amount,
    address,
    networkType,
    type,
    lock,
    chainTip,
    tokenId,
    utxo,
  })

  if (type === 'LockThenTransfer' && !lock) {
    throw new Error('LockThenTransfer requires a lock')
  }

  console.log('aaa', type, amount)
  const amountInstace = amount ? Amount.from_atoms(amount) : undefined

  const networkIndex = NETWORKS[networkType]
  if (type === 'Transfer') {
    if (tokenId) {
      console.log(
        'amountInstace,\n' +
          '        address,\n' +
          '        tokenId,\n' +
          '        networkIndex,',
        amountInstace,
        address,
        tokenId,
        networkIndex,
      )
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
  const networkIndex = NETWORKS[networkType]
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
  const networkIndex = NETWORKS[networkType]
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
  const networkIndex = NETWORKS[networkType]

  return get_token_id(inputs, networkIndex)
}
