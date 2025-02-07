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
 * derivation path: 44'/mintlayer_coin_type'/0'/0/key_index
 */
export function make_receiving_address(
  private_key_bytes: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * From an extended private key create a change private key for a given key index
 * derivation path: 44'/mintlayer_coin_type'/0'/1/key_index
 */
export function make_change_address(
  private_key_bytes: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * Given a public key (as bytes) and a network type (mainnet, testnet, etc),
 * return the address public key hash from that public key as an address
 */
export function pubkey_to_pubkeyhash_address(
  public_key_bytes: Uint8Array,
  network: Network,
): string
/**
 * Given a private key, as bytes, return the bytes of the corresponding public key
 */
export function public_key_from_private_key(private_key: Uint8Array): Uint8Array
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
 * Given a message and a private key, create and sign a challenge with the given private key
 * This kind of signature is to be used when signing challenges.
 */
export function sign_challenge(
  private_key: Uint8Array,
  message: Uint8Array,
): Uint8Array
/**
 * Given a signed challenge, an address and a message. Verify that
 * the signature is produced by signing the message with the private key
 * that derived the given public key.
 * Note that this function is used for verifying messages related challenges.
 */
export function verify_challenge(
  address: string,
  network: Network,
  signed_challenge: Uint8Array,
  message: Uint8Array,
): boolean
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
 * Given a pool id, staking data as bytes and the network type (mainnet, testnet, etc),
 * this function returns an output that creates that staking pool.
 * Note that the pool id is mandated to be taken from the hash of the first input.
 * It is not arbitrary.
 */
export function encode_output_create_stake_pool(
  pool_id: string,
  pool_data: Uint8Array,
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
 * Given the parameters needed to issue a fungible token, and a network type (mainnet, testnet, etc),
 * this function creates an output that issues that token.
 */
export function encode_output_issue_fungible_token(
  authority: string,
  token_ticker: string,
  metadata_uri: string,
  number_of_decimals: number,
  total_supply: TotalSupply,
  supply_amount: Amount | undefined,
  is_token_freezable: FreezableToken,
  _current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Returns the Fungible/NFT Token ID for the given inputs of a transaction
 */
export function get_token_id(inputs: Uint8Array, network: Network): string
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
  creator: Uint8Array | undefined,
  media_uri: string | undefined,
  icon_uri: string | undefined,
  additional_metadata_uri: string | undefined,
  _current_block_height: bigint,
  network: Network,
): Uint8Array
/**
 * Given data to be deposited in the blockchain, this function provides the output that deposits this data
 */
export function encode_output_data_deposit(data: Uint8Array): Uint8Array
/**
 * Returns the fee that needs to be paid by a transaction for issuing a data deposit
 */
export function data_deposit_fee(
  current_block_height: bigint,
  network: Network,
): Amount
/**
 * Given the parameters needed to create hash timelock contract, and a network type (mainnet, testnet, etc),
 * this function creates an output.
 */
export function encode_output_htlc(
  amount: Amount,
  token_id: string | undefined,
  secret_hash: string,
  spend_address: string,
  refund_address: string,
  refund_timelock: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given a signed transaction and input outpoint that spends an htlc utxo, extract a secret that is
 * encoded in the corresponding input signature
 */
export function extract_htlc_secret(
  signed_tx_bytes: Uint8Array,
  strict_byte_size: boolean,
  htlc_outpoint_source_id: Uint8Array,
  htlc_output_index: number,
): Uint8Array
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
 * Encode an input witness of the variant that contains no signature.
 */
export function encode_witness_no_signature(): Uint8Array
/**
 * Given a private key, inputs and an input number to sign, and the destination that owns that output (through the utxo),
 * and a network type (mainnet, testnet, etc), this function returns a witness to be used in a signed transaction, as bytes.
 */
export function encode_witness(
  sighashtype: SignatureHashType,
  private_key_bytes: Uint8Array,
  input_owner_destination: string,
  transaction_bytes: Uint8Array,
  inputs: Uint8Array,
  input_num: number,
  network: Network,
): Uint8Array
/**
 * Given a private key, inputs and an input number to sign, and the destination that owns that output (through the utxo),
 * and a network type (mainnet, testnet, etc), and an htlc secret this function returns a witness to be used in a signed transaction, as bytes.
 */
export function encode_witness_htlc_secret(
  sighashtype: SignatureHashType,
  private_key_bytes: Uint8Array,
  input_owner_destination: string,
  transaction_bytes: Uint8Array,
  inputs: Uint8Array,
  input_num: number,
  secret: Uint8Array,
  network: Network,
): Uint8Array
/**
 * Given an arbitrary number of public keys as bytes, number of minimum required signatures, and a network type, this function returns
 * the multisig challenge, as bytes.
 */
export function encode_multisig_challenge(
  public_keys_bytes: Uint8Array,
  min_required_signatures: number,
  network: Network,
): Uint8Array
/**
 * Given a private key, inputs and an input number to sign, and multisig challenge,
 * and a network type (mainnet, testnet, etc), this function returns a witness to be used in a signed transaction, as bytes.
 *
 * `key_index` parameter is an index of a public key in the challenge, against which is the signature produces from private key is to be verified.
 * `input_witness` parameter can be either empty or a result of previous calls to this function.
 */
export function encode_witness_htlc_multisig(
  sighashtype: SignatureHashType,
  private_key_bytes: Uint8Array,
  key_index: number,
  input_witness: Uint8Array,
  multisig_challenge: Uint8Array,
  transaction_bytes: Uint8Array,
  utxos: Uint8Array,
  input_num: number,
  network: Network,
): Uint8Array
/**
 * Given an unsigned transaction and signatures, this function returns a SignedTransaction object as bytes.
 */
export function encode_signed_transaction(
  transaction_bytes: Uint8Array,
  signatures: Uint8Array,
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
  transaction_bytes: Uint8Array,
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
 * Given ask and give amounts and a conclude key create output that creates an order.
 *
 * 'ask_token_id': the parameter represents a Token if it's Some and coins otherwise.
 * 'give_token_id': the parameter represents a Token if it's Some and coins otherwise.
 */
export function encode_create_order_output(
  ask_amount: Amount,
  ask_token_id: string | undefined,
  give_amount: Amount,
  give_token_id: string | undefined,
  conclude_address: string,
  network: Network,
): Uint8Array
/**
 * Given an amount to fill an order (which is described in terms of ask currency) and a destination
 * for result outputs create an input that fills the order.
 */
export function encode_input_for_fill_order(
  order_id: string,
  fill_amount: Amount,
  destination: string,
  nonce: bigint,
  network: Network,
): Uint8Array
/**
 * Given an order id create an input that concludes the order.
 */
export function encode_input_for_conclude_order(
  order_id: string,
  nonce: bigint,
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
 * Amount type abstraction. The amount type is stored in a string
 * since JavaScript number type cannot fit 128-bit integers.
 * The amount is given as an integer in units of "atoms".
 * Atoms are the smallest, indivisible amount of a coin or token.
 */
export class Amount {
  private constructor()
  free(): void
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
  readonly __wbg_amount_free: (a: number, b: number) => void
  readonly amount_from_atoms: (a: number, b: number) => number
  readonly amount_atoms: (a: number) => [number, number]
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
  readonly staking_pool_spend_maturity_block_count: (
    a: bigint,
    b: number,
  ) => bigint
  readonly encode_lock_for_block_count: (a: bigint) => [number, number]
  readonly encode_lock_for_seconds: (a: bigint) => [number, number]
  readonly encode_lock_until_time: (a: bigint) => [number, number]
  readonly encode_lock_until_height: (a: bigint) => [number, number]
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
  readonly encode_output_create_stake_pool: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => [number, number, number, number]
  readonly fungible_token_issuance_fee: (a: bigint, b: number) => number
  readonly nft_issuance_fee: (a: bigint, b: number) => number
  readonly token_supply_change_fee: (a: bigint, b: number) => number
  readonly token_freeze_fee: (a: bigint, b: number) => number
  readonly token_change_authority_fee: (a: bigint, b: number) => number
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
  readonly get_token_id: (
    a: number,
    b: number,
    c: number,
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
  readonly data_deposit_fee: (a: bigint, b: number) => number
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
  readonly extract_htlc_secret: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
  ) => [number, number, number, number]
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
    k: number,
  ) => [number, number, number, number]
  readonly encode_witness_htlc_secret: (
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
  ) => [number, number, number, number]
  readonly encode_multisig_challenge: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => [number, number, number, number]
  readonly encode_witness_htlc_multisig: (
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
  ) => [number, number, number, number]
  readonly encode_signed_transaction: (
    a: number,
    b: number,
    c: number,
    d: number,
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
  readonly encode_input_for_fill_order: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: bigint,
    g: number,
  ) => [number, number, number, number]
  readonly encode_input_for_conclude_order: (
    a: number,
    b: number,
    c: bigint,
    d: number,
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
