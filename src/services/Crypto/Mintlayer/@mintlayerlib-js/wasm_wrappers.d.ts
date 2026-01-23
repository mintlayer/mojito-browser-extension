/* tslint:disable */
/* eslint-disable */
/**
 * A utxo can either come from a transaction or a block reward.
 * Given a source id, whether from a block reward or transaction, this function
 * takes a generic id with it, and returns serialized binary data of the id
 * with the given source id.
 */
export function encode_outpoint_source_id(
  id: Uint8Array,
  source: SourceId,
): Uint8Array
/**
 * Generates a new, random private key from entropy
 */
export function make_private_key(): Uint8Array
/**
 * Create the default account's extended private key for a given mnemonic
 * derivation path: 44'/mintlayer_coin_type'/0'
 */
export function make_default_account_privkey(
  mnemonic: string,
  network: Network,
): Uint8Array
/**
 * From an extended private key create a receiving private key for a given key index
 * derivation path: current_derivation_path/0/key_index
 */
export function make_receiving_address(
  private_key: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * From an extended private key create a change private key for a given key index
 * derivation path: current_derivation_path/1/key_index
 */
export function make_change_address(
  private_key: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * Given a public key (as bytes) and a network type (mainnet, testnet, etc),
 * return the address public key hash from that public key as an address
 */
export function pubkey_to_pubkeyhash_address(
  public_key: Uint8Array,
  network: Network,
): string
/**
 * Given a private key, as bytes, return the bytes of the corresponding public key
 */
export function public_key_from_private_key(private_key: Uint8Array): Uint8Array
/**
 * Return the extended public key from an extended private key
 */
export function extended_public_key_from_extended_private_key(
  private_key: Uint8Array,
): Uint8Array
/**
 * From an extended public key create a receiving public key for a given key index
 * derivation path: current_derivation_path/0/key_index
 */
export function make_receiving_address_public_key(
  extended_public_key: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * From an extended public key create a change public key for a given key index
 * derivation path: current_derivation_path/1/key_index
 */
export function make_change_address_public_key(
  extended_public_key: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * Given a message and a private key, sign the message with the given private key
 * This kind of signature is to be used when signing spend requests, such as transaction
 * input witness.
 */
export function sign_message_for_spending(
  private_key: Uint8Array,
  message: Uint8Array,
): Uint8Array
/**
 * Given a digital signature, a public key and a message. Verify that
 * the signature is produced by signing the message with the private key
 * that derived the given public key.
 * Note that this function is used for verifying messages related to spending,
 * such as transaction input witness.
 */
export function verify_signature_for_spending(
  public_key: Uint8Array,
  signature: Uint8Array,
  message: Uint8Array,
): boolean
/**
 * Given a message and a private key, create and sign a challenge with the given private key.
 * This kind of signature is to be used when signing challenges.
 */
export function sign_challenge(
  private_key: Uint8Array,
  message: Uint8Array,
): Uint8Array
/**
 * Given a signed challenge, an address and a message, verify that
 * the signature is produced by signing the message with the private key
 * that derived the given public key.
 * This function is used for verifying messages-related challenges.
 *
 * Note: for signatures that were created by `sign_challenge`, the provided address must be
 * a 'pubkeyhash' address.
 *
 * Note: currently this function never returns `false` - it either returns `true` or fails with an error.
 */
export function verify_challenge(
  address: string,
  network: Network,
  signed_challenge: Uint8Array,
  message: Uint8Array,
): boolean
/**
 * Return the message that has to be signed to produce a signed transaction intent.
 */
export function make_transaction_intent_message_to_sign(
  intent: string,
  transaction_id: string,
): Uint8Array
/**
 * Return a `SignedTransactionIntent` object as bytes given the message and encoded signatures.
 *
 * Note: to produce a valid signed intent one is expected to sign the corresponding message by private keys
 * corresponding to each input of the transaction.
 *
 * Parameters:
 * `signed_message` - this must have been produced by `make_transaction_intent_message_to_sign`.
 * `signatures` - this should be an array of Uint8Array, each of them representing an individual signature
 * of `signed_message` produced by `sign_challenge` using the private key for the corresponding input destination
 * of the transaction. The number of signatures must be equal to the number of inputs in the transaction.
 */
export function encode_signed_transaction_intent(
  signed_message: Uint8Array,
  signatures: Uint8Array[],
): Uint8Array
/**
 * Verify a signed transaction intent.
 *
 * Parameters:
 * `expected_signed_message` - the message that is supposed to be signed; this must have been
 * produced by `make_transaction_intent_message_to_sign`.
 * `encoded_signed_intent` - the signed transaction intent produced by `encode_signed_transaction_intent`.
 * `input_destinations` - an array of addresses (strings), corresponding to the transaction's input destinations
 * (note that this function treats "pub key" and "pub key hash" addresses interchangeably, so it's ok to pass
 * one instead of the other).
 * `network` - the network being used (needed to decode the addresses).
 */
export function verify_transaction_intent(
  expected_signed_message: Uint8Array,
  encoded_signed_intent: Uint8Array,
  input_destinations: string[],
  network: Network,
): void
/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this function returns the number of blocks, after which a pool that decommissioned,
 * will have its funds unlocked and available for spending.
 * The current block height information is used in case a network upgrade changed the value.
 */
export function staking_pool_spend_maturity_block_count(
  current_block_height: bigint,
  network: Network,
): bigint
/**
 * Given a number of blocks, this function returns the output timelock
 * which is used in locked outputs to lock an output for a given number of blocks
 * since that output's transaction is included the blockchain
 */
export function encode_lock_for_block_count(block_count: bigint): Uint8Array
/**
 * Given a number of clock seconds, this function returns the output timelock
 * which is used in locked outputs to lock an output for a given number of seconds
 * since that output's transaction is included in the blockchain
 */
export function encode_lock_for_seconds(total_seconds: bigint): Uint8Array
/**
 * Given a timestamp represented by as unix timestamp, i.e., number of seconds since unix epoch,
 * this function returns the output timelock which is used in locked outputs to lock an output
 * until the given timestamp
 */
export function encode_lock_until_time(
  timestamp_since_epoch_in_seconds: bigint,
): Uint8Array
/**
 * Given a block height, this function returns the output timelock which is used in
 * locked outputs to lock an output until that block height is reached.
 */
export function encode_lock_until_height(block_height: bigint): Uint8Array
/**
 * This function returns the staking pool data needed to create a staking pool in an output as bytes,
 * given its parameters and the network type (testnet, mainnet, etc).
 */
export function encode_stake_pool_data(
  value: Amount,
  staker: string,
  vrf_public_key: string,
  decommission_key: string,
  margin_ratio_per_thousand: number,
  cost_per_block: Amount,
  network: Network,
): Uint8Array
/**
 * Returns the fee that needs to be paid by a transaction for issuing a new fungible token
 */
export function fungible_token_issuance_fee(
  _current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for issuing a new NFT
 * The current block height information is used in case a network upgrade changed the value.
 */
export function nft_issuance_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for changing the total supply of a token
 * by either minting or unminting tokens
 * The current block height information is used in case a network upgrade changed the value.
 */
export function token_supply_change_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for freezing/unfreezing a token
 * The current block height information is used in case a network upgrade changed the value.
 */
export function token_freeze_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for changing the authority of a token
 * The current block height information is used in case a network upgrade changed the value.
 */
export function token_change_authority_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Returns the Fungible/NFT Token ID for the given inputs of a transaction
 */
export function get_token_id(
  inputs: Uint8Array,
  current_block_height: bigint,
  network: Network,
): string
/**
 * Returns the Order ID for the given inputs of a transaction
 */
export function get_order_id(inputs: Uint8Array, network: Network): string
/**
 * Returns the Delegation ID for the given inputs of a transaction
 */
export function get_delegation_id(inputs: Uint8Array, network: Network): string
/**
 * Returns the Pool ID for the given inputs of a transaction
 */
export function get_pool_id(inputs: Uint8Array, network: Network): string
/**
 * Returns the fee that needs to be paid by a transaction for issuing a data deposit
 */
export function data_deposit_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given a signed transaction and input outpoint that spends an htlc utxo, extract a secret that is
 * encoded in the corresponding input signature
 */
export function extract_htlc_secret(
  signed_tx: Uint8Array,
  strict_byte_size: boolean,
  htlc_outpoint_source_id: Uint8Array,
  htlc_output_index: number,
): Uint8Array
/**
 * Given the inputs, along each input's destination that can spend that input
 * (e.g. If we are spending a UTXO in input number 1 and it is owned by address mtc1xxxx, then it is mtc1xxxx in element number 2 in the vector/list.
 * for Account inputs that spend from a delegation it is the owning address of that delegation,
 * and in the case of AccountCommand inputs which change a token it is the token's authority destination)
 * and the outputs, estimate the transaction size.
 * ScriptHash and ClassicMultisig destinations are not supported.
 */
export function estimate_transaction_size(
  inputs: Uint8Array,
  input_utxos_destinations: string[],
  outputs: Uint8Array,
  network: Network,
): number
/**
 * Given inputs as bytes, outputs as bytes, and flags settings, this function returns
 * the transaction that contains them all, as bytes.
 */
export function encode_transaction(
  inputs: Uint8Array,
  outputs: Uint8Array,
  flags: bigint,
): Uint8Array
/**
 * Decodes a signed transaction from its binary encoding into a JavaScript object.
 */
export function decode_signed_transaction_to_js(
  transaction: Uint8Array,
  network: Network,
): any
/**
 * Encode an input witness of the variant that contains no signature.
 */
export function encode_witness_no_signature(): Uint8Array
/**
 * Sign the specified input of the transaction and encode the signature as InputWitness.
 *
 * `input_utxos` must be formed as follows: for each transaction input, emit byte 0 if it's a non-UTXO input,
 * otherwise emit 1 followed by the corresponding transaction output encoded via the appropriate "encode_output_"
 * function.
 *
 * `additional_info` must contain the following:
 * 1) for each `ProduceBlockFromStake` input of the transaction, the pool info for the pool referenced by that input;
 * 2) for each `FillOrder` and `ConcludeOrder` input of the transaction, the order info for the order referenced by
 *    that input.
 * Note:
 * - It doesn't matter which input witness is currently being encoded. E.g. even if you are encoding a witness
 *   for some UTXO-based input but another input of the same transaction is `FillOrder`, you have to include the order
 *   info when encoding the witness for the UTXO-based input too.
 * - After a certain hard fork, the produced signature will "commit" to the provided additional info, i.e. the info
 *   will become a part of what is being signed. So, passing invalid additional info will result in an invalid signature
 *   (with one small caveat: for `FillOrder` we only commit to order's initial balances and not the current ones;
 *   so if you only have `FillOrder` inputs, you can technically pass bogus values for the current balances and
 *   the resulting signature will still be valid; though it's better to avoid doing this).
 */
export function encode_witness(
  sighashtype: SignatureHashType,
  private_key: Uint8Array,
  input_owner_destination: string,
  transaction: Uint8Array,
  input_utxos: Uint8Array,
  input_index: number,
  additional_info: TxAdditionalInfo,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Sign the specified HTLC input of the transaction and encode the signature as InputWitness.
 *
 * This function must be used for HTLC spending.
 *
 * `input_utxos` and `additional_info` have the same format and requirements as in `encode_witness`.
 */
export function encode_witness_htlc_spend(
  sighashtype: SignatureHashType,
  private_key: Uint8Array,
  input_owner_destination: string,
  transaction: Uint8Array,
  input_utxos: Uint8Array,
  input_index: number,
  secret: Uint8Array,
  additional_info: TxAdditionalInfo,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given an arbitrary number of public keys as bytes, number of minimum required signatures, and a network type, this function returns
 * the multisig challenge, as bytes.
 */
export function encode_multisig_challenge(
  public_keys: Uint8Array,
  min_required_signatures: number,
  network: Network,
): Uint8Array
/**
 * Produce a multisig address given a multisig challenge.
 */
export function multisig_challenge_to_address(
  multisig_challenge: Uint8Array,
  network: Network,
): string
/**
 * Sign the specified HTLC input of the transaction and encode the signature as InputWitness.
 *
 * This function must be used for HTLC refunding when the refund address is a multisig one.
 *
 * `key_index` parameter is an index of the public key in the multisig challenge corresponding to
 * the specified private key.
 * `input_witness` parameter can be either empty or a result of previous calls to this function.
 *
 * `input_utxos` and `additional_info` have the same format and requirements as in `encode_witness`.
 */
export function encode_witness_htlc_refund_multisig(
  sighashtype: SignatureHashType,
  private_key: Uint8Array,
  key_index: number,
  input_witness: Uint8Array,
  multisig_challenge: Uint8Array,
  transaction: Uint8Array,
  input_utxos: Uint8Array,
  input_index: number,
  additional_info: TxAdditionalInfo,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Sign the specified HTLC input of the transaction and encode the signature as InputWitness.
 *
 * This function must be used for HTLC refunding when the refund address is a single-sig one.
 *
 * `input_utxos` and `additional_info` have the same format and requirements as in `encode_witness`.
 */
export function encode_witness_htlc_refund_single_sig(
  sighashtype: SignatureHashType,
  private_key: Uint8Array,
  input_owner_destination: string,
  transaction: Uint8Array,
  input_utxos: Uint8Array,
  input_index: number,
  additional_info: TxAdditionalInfo,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given an unsigned transaction and signatures, this function returns a SignedTransaction object as bytes.
 */
export function encode_signed_transaction(
  transaction: Uint8Array,
  signatures: Uint8Array,
): Uint8Array
/**
 * Return a PartiallySignedTransaction object as bytes.
 *
 * `transaction` is an encoded `Transaction` (which can be produced via `encode_transaction`).
 *
 * `signatures`, `input_utxos`, `input_destinations` and `htlc_secrets` are encoded lists of
 * optional objects of the corresponding type. To produce such a list, iterate over your
 * original list of optional objects and then:
 * 1) emit byte 0 if the current object is null;
 * 2) otherwise emit byte 1 followed by the object in its encoded form.
 *
 * Each individual object in each of the lists corresponds to the transaction input with the same
 * index and its meaning is as follows:
 *   1) `signatures` - the signature for the input;
 *   2) `input_utxos`- the utxo for the input (if it's utxo-based);
 *   3) `input_destinations` - the destination (address) corresponding to the input; this determines
 *      the key(s) with which the input has to be signed. Note that for utxo-based inputs the
 *      corresponding destination can usually be extracted from the utxo itself (the exception
 *      being the `ProduceBlockFromStake` utxo, which doesn't contain the pool's decommission key).
 *      However, PartiallySignedTransaction requires that *all* input destinations are provided
 *      explicitly anyway.
 *   4) `htlc_secrets` - if the input is an HTLC one and if the transaction is spending the HTLC,
 *      this should be the HTLC secret. Otherwise it should be null.
 *
 *   The number of items in each list must be equal to the number of transaction inputs.
 *
 * `additional_info` has the same meaning as in `encode_witness`.
 */
export function encode_partially_signed_transaction(
  transaction: Uint8Array,
  signatures: Uint8Array,
  input_utxos: Uint8Array,
  input_destinations: Uint8Array,
  htlc_secrets: Uint8Array,
  additional_info: TxAdditionalInfo,
  network: Network,
): Uint8Array
/**
 * Decodes a partially signed transaction from its binary encoding into a JavaScript object.
 */
export function decode_partially_signed_transaction_to_js(
  transaction: Uint8Array,
  network: Network,
): any
/**
 * Convert the specified string address into a Destination object, encoded as bytes.
 */
export function encode_destination(
  address: string,
  network: Network,
): Uint8Array
/**
 * Given a `Transaction` encoded in bytes (not a signed transaction, but a signed transaction is tolerated by ignoring the extra bytes, by choice)
 * this function will return the transaction id.
 *
 * The second parameter, the boolean, is provided as means of asserting that the given bytes exactly match a `Transaction` object.
 * When set to `true`, the bytes provided must exactly match a single `Transaction` object.
 * When set to `false`, extra bytes can exist, but will be ignored.
 * This is useful when the provided bytes are of a `SignedTransaction` instead of a `Transaction`,
 * since the signatures are appended at the end of the `Transaction` object as a vector to create a `SignedTransaction`.
 * It is recommended to use a strict `Transaction` size and set the second parameter to `true`.
 */
export function get_transaction_id(
  transaction: Uint8Array,
  strict_byte_size: boolean,
): string
/**
 * Calculate the "effective balance" of a pool, given the total pool balance and pledge by the pool owner/staker.
 * The effective balance is how the influence of a pool is calculated due to its balance.
 */
export function effective_pool_balance(
  network: Network,
  pledge_amount: Amount,
  pool_balance: Amount,
): Amount
/**
 * Given an output source id as bytes, and an output index, together representing a utxo,
 * this function returns the input that puts them together, as bytes.
 */
export function encode_input_for_utxo(
  outpoint_source_id: Uint8Array,
  output_index: number,
): Uint8Array
/**
 * Given a delegation id, an amount and a network type (mainnet, testnet, etc), this function
 * creates an input that withdraws from a delegation.
 * A nonce is needed because this spends from an account. The nonce must be in sequence for everything in that account.
 */
export function encode_input_for_withdraw_from_delegation(
  delegation_id: string,
  amount: Amount,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id, an amount of tokens to mint and nonce return an encoded mint tokens input
 */
export function encode_input_for_mint_tokens(
  token_id: string,
  amount: Amount,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id and nonce return an encoded unmint tokens input
 */
export function encode_input_for_unmint_tokens(
  token_id: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id and nonce return an encoded lock_token_supply input
 */
export function encode_input_for_lock_token_supply(
  token_id: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id, is token unfreezable and nonce return an encoded freeze token input
 */
export function encode_input_for_freeze_token(
  token_id: string,
  is_token_unfreezable: TokenUnfreezable,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id and nonce return an encoded unfreeze token input
 */
export function encode_input_for_unfreeze_token(
  token_id: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id, new authority destination and nonce return an encoded change token authority input
 */
export function encode_input_for_change_token_authority(
  token_id: string,
  new_authority: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given a token_id, new metadata uri and nonce return an encoded change token metadata uri input
 */
export function encode_input_for_change_token_metadata_uri(
  token_id: string,
  new_metadata_uri: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given an order id and an amount in the order's ask currency, create an input that fills the order.
 *
 * Note:
 * 1) The nonce is only needed before the orders V1 fork activation. After the fork the nonce is
 *    ignored and any value can be passed for the parameter.
 * 2) FillOrder inputs should not be signed, i.e. use `encode_witness_no_signature` for the inputs
 *    instead of `encode_witness`).
 *    Note that in orders v0 FillOrder inputs can technically have a signature, it's just not checked.
 *    But in orders V1 we actually require that those inputs don't have signatures.
 *    Also, in orders V1 the provided destination is always ignored.
 */
export function encode_input_for_fill_order(
  order_id: string,
  fill_amount: Amount,
  destination: string,
  nonce: bigint,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given an order id create an input that freezes the order.
 *
 * Note: order freezing is available only after the orders V1 fork activation.
 */
export function encode_input_for_freeze_order(
  order_id: string,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given an order id create an input that concludes the order.
 *
 * Note: the nonce is only needed before the orders V1 fork activation. After the fork the nonce is
 * ignored and any value can be passed for the parameter.
 */
export function encode_input_for_conclude_order(
  order_id: string,
  nonce: bigint,
  current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Verify a witness produced by one of the `encode_witness` functions.
 *
 * `input_owner_destination` must be specified if `witness` actually contains a signature
 * (i.e. it's not InputWitness::NoSignature) and the input is not an HTLC one. Otherwise it must
 * be null.
 */
export function internal_verify_witness(
  sighashtype: SignatureHashType,
  input_owner_destination: string | null | undefined,
  witness: Uint8Array,
  transaction: Uint8Array,
  input_utxos: Uint8Array,
  input_index: number,
  additional_info: TxAdditionalInfo,
  current_block_height: bigint,
  network: Network,
): void
/**
 * Given a destination address, an amount and a network type (mainnet, testnet, etc), this function
 * creates an output of type Transfer, and returns it as bytes.
 */
export function encode_output_transfer(
  amount: Amount,
  address: string,
  network: Network,
): Uint8Array
/**
 * Given a destination address, an amount, token ID (in address form) and a network type (mainnet, testnet, etc), this function
 * creates an output of type Transfer for tokens, and returns it as bytes.
 */
export function encode_output_token_transfer(
  amount: Amount,
  address: string,
  token_id: string,
  network: Network,
): Uint8Array
/**
 * Given a valid receiving address, and a locking rule as bytes (available in this file),
 * and a network type (mainnet, testnet, etc), this function creates an output of type
 * LockThenTransfer with the parameters provided.
 */
export function encode_output_lock_then_transfer(
  amount: Amount,
  address: string,
  lock: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given a valid receiving address, token ID (in address form), a locking rule as bytes (available in this file),
 * and a network type (mainnet, testnet, etc), this function creates an output of type
 * LockThenTransfer with the parameters provided.
 */
export function encode_output_token_lock_then_transfer(
  amount: Amount,
  address: string,
  token_id: string,
  lock: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given an amount, this function creates an output (as bytes) to burn a given amount of coins
 */
export function encode_output_coin_burn(amount: Amount): Uint8Array
/**
 * Given an amount, token ID (in address form) and network type (mainnet, testnet, etc),
 * this function creates an output (as bytes) to burn a given amount of tokens
 */
export function encode_output_token_burn(
  amount: Amount,
  token_id: string,
  network: Network,
): Uint8Array
/**
 * Given a pool id as string, an owner address and a network type (mainnet, testnet, etc),
 * this function returns an output (as bytes) to create a delegation to the given pool.
 * The owner address is the address that is authorized to withdraw from that delegation.
 */
export function encode_output_create_delegation(
  pool_id: string,
  owner_address: string,
  network: Network,
): Uint8Array
/**
 * Given a delegation id (as string, in address form), an amount and a network type (mainnet, testnet, etc),
 * this function returns an output (as bytes) that would delegate coins to be staked in the specified delegation id.
 */
export function encode_output_delegate_staking(
  amount: Amount,
  delegation_id: string,
  network: Network,
): Uint8Array
/**
 * Given a pool id, staking data as bytes and the network type (mainnet, testnet, etc),
 * this function returns an output that creates that staking pool.
 * Note that the pool id is mandated to be taken from the hash of the first input.
 * It is not arbitrary.
 *
 * Note: a UTXO of this kind is consumed when decommissioning a pool (provided that the pool
 * never staked).
 */
export function encode_output_create_stake_pool(
  pool_id: string,
  pool_data: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given a pool id and a staker address, this function returns an output that is emitted
 * when producing a block via that pool.
 *
 * Note: a UTXO of this kind is consumed when decommissioning a pool (provided that the pool
 * has staked at least once).
 */
export function encode_output_produce_block_from_stake(
  pool_id: string,
  staker: string,
  network: Network,
): Uint8Array
/**
 * Given the parameters needed to issue a fungible token, and a network type (mainnet, testnet, etc),
 * this function creates an output that issues that token.
 */
export function encode_output_issue_fungible_token(
  authority: string,
  token_ticker: string,
  metadata_uri: string,
  number_of_decimals: number,
  total_supply: TotalSupply,
  supply_amount: Amount | null | undefined,
  is_token_freezable: FreezableToken,
  _current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given the parameters needed to issue an NFT, and a network type (mainnet, testnet, etc),
 * this function creates an output that issues that NFT.
 */
export function encode_output_issue_nft(
  token_id: string,
  authority: string,
  name: string,
  ticker: string,
  description: string,
  media_hash: Uint8Array,
  creator: Uint8Array | null | undefined,
  media_uri: string | null | undefined,
  icon_uri: string | null | undefined,
  additional_metadata_uri: string | null | undefined,
  _current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given data to be deposited in the blockchain, this function provides the output that deposits this data
 */
export function encode_output_data_deposit(data: Uint8Array): Uint8Array
/**
 * Given the parameters needed to create hash timelock contract, and a network type (mainnet, testnet, etc),
 * this function creates an output.
 */
export function encode_output_htlc(
  amount: Amount,
  token_id: string | null | undefined,
  secret_hash: string,
  spend_address: string,
  refund_address: string,
  refund_timelock: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given ask and give amounts and a conclude key create output that creates an order.
 *
 * 'ask_token_id': the parameter represents a Token if it's Some and coins otherwise.
 * 'give_token_id': the parameter represents a Token if it's Some and coins otherwise.
 */
export function encode_create_order_output(
  ask_amount: Amount,
  ask_token_id: string | null | undefined,
  give_amount: Amount,
  give_token_id: string | null | undefined,
  conclude_address: string,
  network: Network,
): Uint8Array
/**
 * Indicates whether a token can be frozen
 */
export enum FreezableToken {
  No = 0,
  Yes = 1,
}
/**
 * The network, for which an operation to be done. Mainnet, testnet, etc.
 */
export enum Network {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
  Signet = 3,
}
/**
 * The part of the transaction that will be committed in the signature. Similar to bitcoin's sighash.
 */
export enum SignatureHashType {
  ALL = 0,
  NONE = 1,
  SINGLE = 2,
  ANYONECANPAY = 3,
}
/**
 * A utxo can either come from a transaction or a block reward. This enum signifies that.
 */
export enum SourceId {
  Transaction = 0,
  BlockReward = 1,
}
/**
 * Indicates whether a token can be unfrozen once frozen
 */
export enum TokenUnfreezable {
  No = 0,
  Yes = 1,
}
/**
 * The token supply of a specific token, set on issuance
 */
export enum TotalSupply {
  /**
   * Can be issued with no limit, but then can be locked to have a fixed supply.
   */
  Lockable = 0,
  /**
   * Unlimited supply, no limits except for numeric limits due to u128
   */
  Unlimited = 1,
  /**
   * On issuance, the total number of coins is fixed
   */
  Fixed = 2,
}
/**
 * An alternative representation of `Amount`.
 */
export interface SimpleAmount {
  atoms: string
}

/**
 * An amount of some token.
 */
export interface SimpleTokenAmount {
  token_id: string
  amount: SimpleAmount
}

/**
 * An amount of coins or some token,
 */
export type SimpleCurrencyAmount =
  | { coins: SimpleAmount }
  | { tokens: SimpleTokenAmount }

/**
 * Additional information for a pool.
 */
export interface PoolAdditionalInfo {
  staker_balance: SimpleAmount
}

/**
 * Additional information for an order.
 */
export interface OrderAdditionalInfo {
  initially_asked: SimpleCurrencyAmount
  initially_given: SimpleCurrencyAmount
  ask_balance: SimpleAmount
  give_balance: SimpleAmount
}

/**
 * Additional information for a transaction.
 */
export interface TxAdditionalInfo {
  pool_info: Record<string, PoolAdditionalInfo>
  order_info: Record<string, OrderAdditionalInfo>
}

/**
 * Amount type abstraction. The amount type is stored in a string
 * since JavaScript number type cannot fit 128-bit integers.
 * The amount is given as an integer in units of "atoms".
 * Atoms are the smallest, indivisible amount of a coin or token.
 */
export class Amount {
  private constructor()
  free(): void
  [Symbol.dispose](): void
  static from_atoms(atoms: string): Amount
  atoms(): string
}

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface InitOutput {
  readonly memory: WebAssembly.Memory
  readonly encode_outpoint_source_id: (
    a: number,
    b: number,
    c: number,
  ) => [number, number]
  readonly make_private_key: () => [number, number]
  readonly make_default_account_privkey: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly make_receiving_address: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly make_change_address: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly pubkey_to_pubkeyhash_address: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly public_key_from_private_key: (
    a: number,
    b: number,
  ) => [number, number, number, number]
  readonly extended_public_key_from_extended_private_key: (
    a: number,
    b: number,
  ) => [number, number, number, number]
  readonly make_receiving_address_public_key: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly make_change_address_public_key: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly sign_message_for_spending: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly verify_signature_for_spending: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => [number, number, number]
  readonly sign_challenge: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly verify_challenge: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => [number, number, number]
  readonly make_transaction_intent_message_to_sign: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_signed_transaction_intent: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly verify_transaction_intent: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => [number, number]
  readonly staking_pool_spend_maturity_block_count: (
    a: bigint,
    b: number,
  ) => bigint
  readonly encode_lock_for_block_count: (a: bigint) => [number, number]
  readonly encode_lock_for_seconds: (a: bigint) => [number, number]
  readonly encode_lock_until_time: (a: bigint) => [number, number]
  readonly encode_lock_until_height: (a: bigint) => [number, number]
  readonly encode_stake_pool_data: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
  ) => [number, number, number, number]
  readonly fungible_token_issuance_fee: (a: bigint, b: number) => number
  readonly nft_issuance_fee: (a: bigint, b: number) => number
  readonly token_supply_change_fee: (a: bigint, b: number) => number
  readonly token_freeze_fee: (a: bigint, b: number) => number
  readonly token_change_authority_fee: (a: bigint, b: number) => number
  readonly get_token_id: (
    a: number,
    b: number,
    c: bigint,
    d: number,
  ) => [number, number, number, number]
  readonly get_order_id: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly get_delegation_id: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly get_pool_id: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly data_deposit_fee: (a: bigint, b: number) => number
  readonly extract_htlc_secret: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => [number, number, number, number]
  readonly estimate_transaction_size: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => [number, number, number]
  readonly encode_transaction: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: bigint,
  ) => [number, number, number, number]
  readonly decode_signed_transaction_to_js: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number]
  readonly encode_witness_no_signature: () => [number, number]
  readonly encode_witness: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: any,
    l: bigint,
    m: number,
  ) => [number, number, number, number]
  readonly encode_witness_htlc_spend: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
    m: any,
    n: bigint,
    o: number,
  ) => [number, number, number, number]
  readonly encode_multisig_challenge: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly multisig_challenge_to_address: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly encode_witness_htlc_refund_multisig: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
    m: number,
    n: any,
    o: bigint,
    p: number,
  ) => [number, number, number, number]
  readonly encode_witness_htlc_refund_single_sig: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: any,
    l: bigint,
    m: number,
  ) => [number, number, number, number]
  readonly encode_signed_transaction: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_partially_signed_transaction: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: any,
    l: number,
  ) => [number, number, number, number]
  readonly decode_partially_signed_transaction_to_js: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number]
  readonly encode_destination: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly get_transaction_id: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly effective_pool_balance: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number]
  readonly encode_input_for_utxo: (
    a: number,
    b: number,
    c: number,
  ) => [number, number, number, number]
  readonly encode_input_for_withdraw_from_delegation: (
    a: number,
    b: number,
    c: number,
    d: bigint,
    e: number,
  ) => [number, number, number, number]
  readonly encode_input_for_mint_tokens: (
    a: number,
    b: number,
    c: number,
    d: bigint,
    e: number,
  ) => [number, number, number, number]
  readonly encode_input_for_unmint_tokens: (
    a: number,
    b: number,
    c: bigint,
    d: number,
  ) => [number, number, number, number]
  readonly encode_input_for_lock_token_supply: (
    a: number,
    b: number,
    c: bigint,
    d: number,
  ) => [number, number, number, number]
  readonly encode_input_for_freeze_token: (
    a: number,
    b: number,
    c: number,
    d: bigint,
    e: number,
  ) => [number, number, number, number]
  readonly encode_input_for_unfreeze_token: (
    a: number,
    b: number,
    c: bigint,
    d: number,
  ) => [number, number, number, number]
  readonly encode_input_for_change_token_authority: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: bigint,
    f: number,
  ) => [number, number, number, number]
  readonly encode_input_for_change_token_metadata_uri: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: bigint,
    f: number,
  ) => [number, number, number, number]
  readonly encode_input_for_fill_order: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: bigint,
    g: bigint,
    h: number,
  ) => [number, number, number, number]
  readonly encode_input_for_freeze_order: (
    a: number,
    b: number,
    c: bigint,
    d: number,
  ) => [number, number, number, number]
  readonly encode_input_for_conclude_order: (
    a: number,
    b: number,
    c: bigint,
    d: bigint,
    e: number,
  ) => [number, number, number, number]
  readonly internal_verify_witness: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: any,
    l: bigint,
    m: number,
  ) => [number, number]
  readonly __wbg_amount_free: (a: number, b: number) => void
  readonly amount_from_atoms: (a: number, b: number) => number
  readonly amount_atoms: (a: number) => [number, number]
  readonly encode_output_transfer: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_output_token_transfer: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => [number, number, number, number]
  readonly encode_output_lock_then_transfer: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => [number, number, number, number]
  readonly encode_output_token_lock_then_transfer: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
  ) => [number, number, number, number]
  readonly encode_output_coin_burn: (
    a: number,
  ) => [number, number, number, number]
  readonly encode_output_token_burn: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_output_create_delegation: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => [number, number, number, number]
  readonly encode_output_delegate_staking: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_output_create_stake_pool: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => [number, number, number, number]
  readonly encode_output_produce_block_from_stake: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => [number, number, number, number]
  readonly encode_output_issue_fungible_token: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: bigint,
    l: number,
  ) => [number, number, number, number]
  readonly encode_output_issue_nft: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
    m: number,
    n: number,
    o: number,
    p: number,
    q: number,
    r: number,
    s: number,
    t: number,
    u: bigint,
    v: number,
  ) => [number, number, number, number]
  readonly encode_output_data_deposit: (
    a: number,
    b: number,
  ) => [number, number, number, number]
  readonly encode_output_htlc: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
    j: number,
    k: number,
    l: number,
  ) => [number, number, number, number]
  readonly encode_create_order_output: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
    h: number,
    i: number,
  ) => [number, number, number, number]
  readonly rustsecp256k1_v0_10_0_context_create: (a: number) => number
  readonly rustsecp256k1_v0_10_0_context_destroy: (a: number) => void
  readonly rustsecp256k1_v0_10_0_default_illegal_callback_fn: (
    a: number,
    b: number,
  ) => void
  readonly rustsecp256k1_v0_10_0_default_error_callback_fn: (
    a: number,
    b: number,
  ) => void
  readonly __wbindgen_exn_store: (a: number) => void
  readonly __externref_table_alloc: () => number
  readonly __wbindgen_export_2: WebAssembly.Table
  readonly __wbindgen_malloc: (a: number, b: number) => number
  readonly __wbindgen_realloc: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number
  readonly __wbindgen_free: (a: number, b: number, c: number) => void
  readonly __externref_table_dealloc: (a: number) => void
  readonly __wbindgen_start: () => void
}

export type SyncInitInput = BufferSource | WebAssembly.Module
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(
  module: { module: SyncInitInput } | SyncInitInput,
): InitOutput

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?:
    | { module_or_path: InitInput | Promise<InitInput> }
    | InitInput
    | Promise<InitInput>,
): Promise<InitOutput>
