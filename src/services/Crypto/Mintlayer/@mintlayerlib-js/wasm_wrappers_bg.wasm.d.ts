/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory
export const encode_outpoint_source_id: (
  a: number,
  b: number,
  c: number,
) => [number, number]
export const make_private_key: () => [number, number]
export const make_default_account_privkey: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const make_receiving_address: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const make_change_address: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const pubkey_to_pubkeyhash_address: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const public_key_from_private_key: (
  a: number,
  b: number,
) => [number, number, number, number]
export const extended_public_key_from_extended_private_key: (
  a: number,
  b: number,
) => [number, number, number, number]
export const make_receiving_address_public_key: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const make_change_address_public_key: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const sign_message_for_spending: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const verify_signature_for_spending: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
) => [number, number, number]
export const sign_challenge: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const verify_challenge: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
) => [number, number, number]
export const make_transaction_intent_message_to_sign: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const encode_signed_transaction_intent: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const verify_transaction_intent: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
) => [number, number]
export const staking_pool_spend_maturity_block_count: (
  a: bigint,
  b: number,
) => bigint
export const encode_lock_for_block_count: (a: bigint) => [number, number]
export const encode_lock_for_seconds: (a: bigint) => [number, number]
export const encode_lock_until_time: (a: bigint) => [number, number]
export const encode_lock_until_height: (a: bigint) => [number, number]
export const encode_stake_pool_data: (
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
export const fungible_token_issuance_fee: (a: bigint, b: number) => number
export const nft_issuance_fee: (a: bigint, b: number) => number
export const token_supply_change_fee: (a: bigint, b: number) => number
export const token_freeze_fee: (a: bigint, b: number) => number
export const token_change_authority_fee: (a: bigint, b: number) => number
export const get_token_id: (
  a: number,
  b: number,
  c: bigint,
  d: number,
) => [number, number, number, number]
export const get_order_id: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const get_delegation_id: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const get_pool_id: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const data_deposit_fee: (a: bigint, b: number) => number
export const extract_htlc_secret: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
) => [number, number, number, number]
export const estimate_transaction_size: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
) => [number, number, number]
export const encode_transaction: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: bigint,
) => [number, number, number, number]
export const decode_signed_transaction_to_js: (
  a: number,
  b: number,
  c: number,
) => [number, number, number]
export const encode_witness_no_signature: () => [number, number]
export const encode_witness: (
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
export const encode_witness_htlc_spend: (
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
export const encode_multisig_challenge: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const multisig_challenge_to_address: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const encode_witness_htlc_refund_multisig: (
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
export const encode_witness_htlc_refund_single_sig: (
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
export const encode_signed_transaction: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const encode_partially_signed_transaction: (
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
export const decode_partially_signed_transaction_to_js: (
  a: number,
  b: number,
  c: number,
) => [number, number, number]
export const encode_destination: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const get_transaction_id: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const effective_pool_balance: (
  a: number,
  b: number,
  c: number,
) => [number, number, number]
export const encode_input_for_utxo: (
  a: number,
  b: number,
  c: number,
) => [number, number, number, number]
export const encode_input_for_withdraw_from_delegation: (
  a: number,
  b: number,
  c: number,
  d: bigint,
  e: number,
) => [number, number, number, number]
export const encode_input_for_mint_tokens: (
  a: number,
  b: number,
  c: number,
  d: bigint,
  e: number,
) => [number, number, number, number]
export const encode_input_for_unmint_tokens: (
  a: number,
  b: number,
  c: bigint,
  d: number,
) => [number, number, number, number]
export const encode_input_for_lock_token_supply: (
  a: number,
  b: number,
  c: bigint,
  d: number,
) => [number, number, number, number]
export const encode_input_for_freeze_token: (
  a: number,
  b: number,
  c: number,
  d: bigint,
  e: number,
) => [number, number, number, number]
export const encode_input_for_unfreeze_token: (
  a: number,
  b: number,
  c: bigint,
  d: number,
) => [number, number, number, number]
export const encode_input_for_change_token_authority: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: bigint,
  f: number,
) => [number, number, number, number]
export const encode_input_for_change_token_metadata_uri: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: bigint,
  f: number,
) => [number, number, number, number]
export const encode_input_for_fill_order: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: bigint,
  g: bigint,
  h: number,
) => [number, number, number, number]
export const encode_input_for_freeze_order: (
  a: number,
  b: number,
  c: bigint,
  d: number,
) => [number, number, number, number]
export const encode_input_for_conclude_order: (
  a: number,
  b: number,
  c: bigint,
  d: bigint,
  e: number,
) => [number, number, number, number]
export const internal_verify_witness: (
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
export const __wbg_amount_free: (a: number, b: number) => void
export const amount_from_atoms: (a: number, b: number) => number
export const amount_atoms: (a: number) => [number, number]
export const encode_output_transfer: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const encode_output_token_transfer: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
) => [number, number, number, number]
export const encode_output_lock_then_transfer: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
) => [number, number, number, number]
export const encode_output_token_lock_then_transfer: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
) => [number, number, number, number]
export const encode_output_coin_burn: (
  a: number,
) => [number, number, number, number]
export const encode_output_token_burn: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const encode_output_create_delegation: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
) => [number, number, number, number]
export const encode_output_delegate_staking: (
  a: number,
  b: number,
  c: number,
  d: number,
) => [number, number, number, number]
export const encode_output_create_stake_pool: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
) => [number, number, number, number]
export const encode_output_produce_block_from_stake: (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
) => [number, number, number, number]
export const encode_output_issue_fungible_token: (
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
export const encode_output_issue_nft: (
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
export const encode_output_data_deposit: (
  a: number,
  b: number,
) => [number, number, number, number]
export const encode_output_htlc: (
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
export const encode_create_order_output: (
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
export const rustsecp256k1_v0_10_0_context_create: (a: number) => number
export const rustsecp256k1_v0_10_0_context_destroy: (a: number) => void
export const rustsecp256k1_v0_10_0_default_illegal_callback_fn: (
  a: number,
  b: number,
) => void
export const rustsecp256k1_v0_10_0_default_error_callback_fn: (
  a: number,
  b: number,
) => void
export const __wbindgen_exn_store: (a: number) => void
export const __externref_table_alloc: () => number
export const __wbindgen_export_2: WebAssembly.Table
export const __wbindgen_malloc: (a: number, b: number) => number
export const __wbindgen_realloc: (
  a: number,
  b: number,
  c: number,
  d: number,
) => number
export const __wbindgen_free: (a: number, b: number, c: number) => void
export const __externref_table_dealloc: (a: number) => void
export const __wbindgen_start: () => void
