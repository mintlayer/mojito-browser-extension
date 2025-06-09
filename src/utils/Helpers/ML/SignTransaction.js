import {
  encode_input_for_utxo,
  encode_input_for_conclude_order,
  encode_create_order_output,
  encode_witness,
  encode_signed_transaction,
  encode_transaction,
  encode_outpoint_source_id,
  estimate_transaction_size,
  encode_output_issue_fungible_token,
  encode_input_for_mint_tokens,
  encode_input_for_fill_order,
  make_transaction_intent_message_to_sign,
  encode_signed_transaction_intent,
  sign_challenge,
  get_transaction_id,
  encode_output_token_burn,
  encode_output_coin_burn,
  encode_input_for_unmint_tokens,
  encode_input_for_lock_token_supply,
  encode_input_for_change_token_authority,
  encode_input_for_change_token_metadata_uri,
  encode_input_for_freeze_token,
  encode_input_for_unfreeze_token,
  encode_output_data_deposit,
  encode_output_create_delegation,
  encode_output_delegate_staking,
  encode_input_for_withdraw_from_delegation,
  TokenUnfreezable,
  SourceId,
  SignatureHashType,
  FreezableToken,
  TotalSupply,
  Amount,
} from '../../../services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js'
import { getOutputs } from '../../../services/Crypto/Mintlayer/Mintlayer.js'

function mergeUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)

  const result = new Uint8Array(totalLength)

  let offset = 0
  for (const arr of arrays) {
    result.set(arr, offset)
    offset += arr.length
  }

  return result
}

export function getTransactionBINrepresentation(
  transactionJSONrepresentation,
  _network,
) {
  const network = _network
  const networkType = network === 1 ? 'testnet' : 'mainnet'
  // Binarisation
  // calculate fee and prepare as much transaction as possible
  const inputs = transactionJSONrepresentation.inputs
  const transactionStrings = inputs
    .filter(({ input }) => input.input_type === 'UTXO')
    .map(({ input }) => ({
      transaction: input.source_id,
      index: input.index,
    }))
  const transactionBytes = transactionStrings.map((transaction) => ({
    bytes: Buffer.from(transaction.transaction, 'hex'),
    index: transaction.index,
  }))
  const outpointedSourceIds = transactionBytes.map((transaction) => ({
    source_id: encode_outpoint_source_id(
      transaction.bytes,
      SourceId.Transaction,
    ),
    index: transaction.index,
  }))
  const inputsIds = outpointedSourceIds.map((source) =>
    encode_input_for_utxo(source.source_id, source.index),
  )

  const inputCommands = transactionJSONrepresentation.inputs
    .filter(
      ({ input }) =>
        input.input_type === 'AccountCommand' || input.input_type === 'Account',
    )
    .map(({ input }) => {
      if (input.command === 'ConcludeOrder') {
        return encode_input_for_conclude_order(
          input.order_id,
          BigInt(input.nonce.toString()),
          network,
        )
      }
      if (input.command === 'FillOrder') {
        return encode_input_for_fill_order(
          input.order_id,
          Amount.from_atoms(input.fill_atoms.toString()),
          input.destination,
          BigInt(input.nonce.toString()),
          network,
        )
      }
      if (input.command === 'MintTokens') {
        return encode_input_for_mint_tokens(
          input.token_id,
          Amount.from_atoms(input.amount.atoms.toString()),
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'UnmintTokens') {
        return encode_input_for_unmint_tokens(
          input.token_id,
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'LockTokenSupply') {
        return encode_input_for_lock_token_supply(
          input.token_id,
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'ChangeTokenAuthority') {
        return encode_input_for_change_token_authority(
          input.token_id,
          input.new_authority,
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'ChangeMetadataUri') {
        return encode_input_for_change_token_metadata_uri(
          input.token_id,
          input.new_metadata_uri,
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'FreezeToken') {
        return encode_input_for_freeze_token(
          input.token_id,
          input.is_unfreezable ? TokenUnfreezable.Yes : TokenUnfreezable.No,
          input.nonce.toString(),
          network,
        )
      }
      if (input.command === 'UnfreezeToken') {
        return encode_input_for_unfreeze_token(
          input.token_id,
          input.nonce.toString(),
          network,
        )
      }
      if (input.account_type === 'DelegationBalance') {
        return encode_input_for_withdraw_from_delegation(
          input.delegation_id,
          Amount.from_atoms(input.amount.atoms.toString()),
          BigInt(input.nonce.toString()),
          network,
        )
      }
      return null
    })

  const inputsArray = [...inputCommands, ...inputsIds]

  const outputsArrayItems = transactionJSONrepresentation.outputs.map(
    (output) => {
      if (output.type === 'Transfer') {
        return getOutputs({
          amount: BigInt(output.value.amount.atoms).toString(),
          address: output.destination,
          networkType,
          ...(output?.value?.token_id
            ? { tokenId: output.value.token_id }
            : {}),
        })
      }
      if (output.type === 'LockThenTransfer') {
        return getOutputs({
          type: 'LockThenTransfer',
          lock: output.lock,
          amount: BigInt(output.value.amount.atoms).toString(),
          address: output.destination,
          networkType,
          ...(output?.value?.token_id
            ? { tokenId: output.value.token_id }
            : {}),
        })
      }
      if (output.type === 'CreateOrder') {
        return encode_create_order_output(
          Amount.from_atoms(output.ask_balance.atoms.toString()), //ask_amount
          output.ask_currency.token_id || null, // ask_token_id
          Amount.from_atoms(output.give_balance.atoms.toString()), //give_amount
          output.give_currency.token_id || null, //give_token_id
          output.conclude_destination, // conclude_address
          network, // network
        )
      }
      if (output.type === 'BurnToken') {
        if (output.value.token_id) {
          return encode_output_token_burn(
            Amount.from_atoms(output.value.amount.atoms.toString()), // amount
            output.value.token_id, // token_id
            network, // network
          )
        }
        if (output.value.type === 'Coin') {
          return encode_output_coin_burn(
            Amount.from_atoms(output.value.amount.atoms.toString()), // amount
          )
        }
      }
      if (output.type === 'IssueFungibleToken') {
        const {
          authority,
          is_freezable,
          metadata_uri,
          number_of_decimals,
          token_ticker,
          total_supply,
        } = output

        const chainTip = '200000'

        const is_token_freezable =
          is_freezable === true ? FreezableToken.Yes : FreezableToken.No

        const supply_amount =
          total_supply.type === 'Fixed'
            ? Amount.from_atoms(total_supply.amount.atoms.toString())
            : null

        const total_supply_type =
          total_supply.type === 'Fixed'
            ? TotalSupply.Fixed
            : total_supply.type === 'Lockable'
              ? TotalSupply.Lockable
              : TotalSupply.Unlimited

        return encode_output_issue_fungible_token(
          authority, // ok
          token_ticker.string, // ok
          metadata_uri.string, // ok
          parseInt(number_of_decimals), // ok
          total_supply_type, // ok
          supply_amount, // ok
          is_token_freezable, // ok
          BigInt(chainTip), // ok
          network,
        )
      }

      if (output.type === 'DataDeposit') {
        return encode_output_data_deposit(new TextEncoder().encode(output.data))
      }

      if (output.type === 'CreateDelegationId') {
        return encode_output_create_delegation(
          output.pool_id,
          output.destination,
          network,
        )
      }

      if (output.type === 'DelegateStaking') {
        return encode_output_delegate_staking(
          Amount.from_atoms(output.amount.atoms),
          output.delegation_id,
          network,
        )
      }

      return null
    },
  )
  const outputsArray = outputsArrayItems

  const inputAddresses = transactionJSONrepresentation.inputs
    .filter(({ input }) => input.input_type === 'UTXO')
    .map((input) => input?.utxo?.destination || input?.destination)

  const transactionsize = estimate_transaction_size(
    mergeUint8Arrays(inputsArray),
    inputAddresses,
    mergeUint8Arrays(outputsArray),
    network,
  )

  const feeRate = BigInt(Math.ceil(100000000000 / 1000))

  return {
    inputs: inputsArray,
    outputs: outputsArray,
    transactionsize,
    feeRate,
  }
}

export function getTransactionHEX(
  {
    transactionBINrepresentation,
    transactionJSONrepresentation,
    addressesPrivateKeys,
  },
  _network,
) {
  const network = _network
  const networkType = network === 1 ? 'testnet' : 'mainnet'
  const inputsArray = transactionBINrepresentation.inputs
  const outputsArray = transactionBINrepresentation.outputs
  const transaction = encode_transaction(
    mergeUint8Arrays(inputsArray),
    mergeUint8Arrays(outputsArray),
    BigInt(0),
  )

  const optUtxos_ = transactionJSONrepresentation.inputs.map((input) => {
    if (!input.utxo) {
      return 0
    }
    if (input.utxo.type === 'Transfer') {
      return getOutputs({
        amount: BigInt(input.utxo.value.amount.atoms).toString(),
        address: input.utxo.destination,
        networkType,
        ...(input?.utxo?.value?.token_id
          ? { tokenId: input.utxo.value.token_id }
          : {}),
      })
    }
    if (input.utxo.type === 'LockThenTransfer') {
      return getOutputs({
        amount: BigInt(input.utxo.value.amount.atoms).toString(),
        address: input.utxo.destination,
        networkType,
        type: 'LockThenTransfer',
        lock: input.utxo.lock,
        ...(input?.utxo?.value?.token_id
          ? { tokenId: input.utxo.value.token_id }
          : {}),
      })
    }
    return null
  })

  const optUtxos = []
  for (let i = 0; i < optUtxos_.length; i++) {
    if (transactionJSONrepresentation.inputs[i].input.input_type !== 'UTXO') {
      optUtxos.push(0)
      continue
    } else {
      optUtxos.push(1)
      optUtxos.push(...optUtxos_[i])
      continue
    }
  }

  const encodedWitnesses = transactionJSONrepresentation.inputs.map(
    (input, index) => {
      let address =
        input?.utxo?.destination ||
        input?.input?.authority ||
        input?.input?.destination

      // for delegation withdraws, the address is in outputs
      if (
        transactionJSONrepresentation.inputs[0].input.account_type ===
        'DelegationBalance'
      ) {
        address = transactionJSONrepresentation.outputs[0].destination
      }

      const addressPrivateKey = addressesPrivateKeys[address]

      const witness = encode_witness(
        SignatureHashType.ALL,
        addressPrivateKey,
        address,
        transaction,
        optUtxos,
        index,
        network,
      )
      return witness
    },
  )

  const encodedSignedTransaction = encode_signed_transaction(
    transaction,
    mergeUint8Arrays(encodedWitnesses),
  )
  const txHash = encodedSignedTransaction.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
    '',
  )

  return txHash
}

export function getTransactionIntent({
  intent,
  transactionBINrepresentation,
  transactionJSONrepresentation,
  addressesPrivateKeys,
}) {
  const inputsArray = transactionBINrepresentation.inputs
  const outputsArray = transactionBINrepresentation.outputs
  const transaction = encode_transaction(
    mergeUint8Arrays(inputsArray),
    mergeUint8Arrays(outputsArray),
    BigInt(0),
  )
  const transaction_id = get_transaction_id(transaction)
  const intent_message = make_transaction_intent_message_to_sign(
    intent,
    transaction_id,
  )

  const sign_challenges = transactionJSONrepresentation.inputs.map((input) => {
    const address =
      input?.utxo?.destination ||
      input?.input?.authority ||
      input?.input?.destination
    const addressPrivateKey = addressesPrivateKeys[address]

    const signature = sign_challenge(addressPrivateKey, intent_message)

    return Array.from(signature)
  })
  // sign_challenge

  const encodedIntent = encode_signed_transaction_intent(
    intent_message,
    sign_challenges,
  )

  const encodedIntentHash = encodedIntent.reduce(
    (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
    '',
  )

  return encodedIntentHash
}

export const getTransactionDetails = (transaction) => {
  const { txData } = transaction.request.data

  const flags = {
    isTransfer: false,
    isBridgeRequest: false,
    isTokenMint: false,
    isTokenUnmint: false,
    isTokenMintWithLock: false,
    isIssueToken: false,
    isCreateOrder: false,
    isFillOrder: false,
    isConcludeOrder: false,
    isBurnCoin: false,
    isBurnToken: false,
    isLockTokenSupply: false,
    isChangeTokenAuthority: false,
    isChangeTokenMetadata: false,
    isFreezeToken: false,
    isUnfreezeToken: false,
    isDelegateWithdraw: false,
  }

  const { JSONRepresentation, intent } = txData

  if (intent) {
    flags.isBridgeRequest = true
  }

  JSONRepresentation?.inputs?.forEach((input) => {
    if (input.input.account_type === 'DelegationBalance') {
      flags.isDelegateWithdraw = true
      return
    }

    switch (input.input?.command) {
      case 'MintTokens':
        flags.isTokenMint = true
        break
      case 'UnmintTokens':
        flags.isTokenUnmint = true
        break
      case 'LockTokenSupply':
        flags.isLockTokenSupply = true
        break
      case 'ChangeTokenAuthority':
        flags.isChangeTokenAuthority = true
        break
      case 'ChangeMetadataUri':
        flags.isChangeTokenMetadata = true
        break
      case 'FreezeToken':
        flags.isFreezeToken = true
        break
      case 'UnfreezeToken':
        flags.isUnfreezeToken = true
        break
      case 'FillOrder':
        flags.isFillOrder = true
        break
      case 'ConcludeOrder':
        flags.isConcludeOrder = true
        break
      default:
        break
    }
  })

  JSONRepresentation?.outputs?.forEach((output) => {
    switch (output.type) {
      case 'LockThenTransfer':
        flags.isTokenMintWithLock = true
        break
      case 'IssueFungibleToken':
        flags.isIssueToken = true
        break
      case 'IssueNft':
        flags.isIssueNft = true
        break
      case 'CreateOrder':
        flags.isCreateOrder = true
        break
      case 'BurnCoin':
        flags.isBurnCoin = true
        break
      case 'BurnToken':
        flags.isBurnToken = true
        break
      case 'DataDeposit':
        flags.isDataDeposit = true
        break
      case 'CreateDelegationId':
        flags.isCreateDelegationId = true
        break
      case 'DelegateStaking':
        flags.isDelegateStaking = true
        break
      default:
        break
    }
  })

  if (
    !Object.values(flags).some(
      (flag, key) => key !== 'isTransfer' && flag === true,
    )
  ) {
    flags.isTransfer = true
  }

  const transactionData = transaction.request

  return {
    flags,
    transactionData,
  }
}

export function signChallenge(message, address, keysList) {
  const key = keysList[address]
  if (!key) {
    throw new Error(`No private key found for address: ${address}`)
  }
  const messageBytes = new TextEncoder().encode(message)
  return sign_challenge(key, messageBytes)
}
