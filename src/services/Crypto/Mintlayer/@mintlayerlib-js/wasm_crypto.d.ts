/* tslint:disable */
/* eslint-disable */
/**
 * @returns {Uint8Array}
 */
export function make_private_key(): Uint8Array
/**
 * @param {string} mnemonic
 * @param {number} network
 * @returns {Uint8Array}
 */
export function make_default_account_pubkey(
  mnemonic: string,
  network: number,
): Uint8Array
/**
 * @param {Uint8Array} public_key_bytes
 * @param {number} key_index
 * @returns {Uint8Array}
 */
export function make_receiving_address(
  public_key_bytes: Uint8Array,
  key_index: number,
): Uint8Array
/**
 * @param {Uint8Array} public_key_bytes
 * @param {number} network
 * @returns {string}
 */
export function pubkey_to_string(
  public_key_bytes: Uint8Array,
  network: number,
): string
/**
 * @param {Uint8Array} private_key
 * @returns {Uint8Array}
 */
export function public_key_from_private_key(private_key: Uint8Array): Uint8Array
/**
 * @param {Uint8Array} private_key
 * @param {Uint8Array} message
 * @returns {Uint8Array}
 */
export function sign_message(
  private_key: Uint8Array,
  message: Uint8Array,
): Uint8Array
/**
 * @param {Uint8Array} public_key
 * @param {Uint8Array} signature
 * @param {Uint8Array} message
 * @returns {boolean}
 */
export function verify_signature(
  public_key: Uint8Array,
  signature: Uint8Array,
  message: Uint8Array,
): boolean
/**
 */
export enum Network {
  Mainnet = 0,
  Testnet = 1,
  Regtest = 2,
  Signet = 3,
}

export type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module

export interface InitOutput {
  readonly memory: WebAssembly.Memory
  readonly make_private_key: (a: number) => void
  readonly make_default_account_pubkey: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void
  readonly make_receiving_address: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void
  readonly pubkey_to_string: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => void
  readonly public_key_from_private_key: (
    a: number,
    b: number,
    c: number,
  ) => void
  readonly sign_message: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
  ) => void
  readonly verify_signature: (
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number,
    g: number,
  ) => void
  readonly rustsecp256k1_v0_9_0_context_create: (a: number) => number
  readonly rustsecp256k1_v0_9_0_context_destroy: (a: number) => void
  readonly rustsecp256k1_v0_9_0_default_illegal_callback_fn: (
    a: number,
    b: number,
  ) => void
  readonly rustsecp256k1_v0_9_0_default_error_callback_fn: (
    a: number,
    b: number,
  ) => void
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number
  readonly __wbindgen_free: (a: number, b: number, c: number) => void
  readonly __wbindgen_malloc: (a: number, b: number) => number
  readonly __wbindgen_realloc: (
    a: number,
    b: number,
    c: number,
    d: number,
  ) => number
  readonly __wbindgen_exn_store: (a: number) => void
}

export type SyncInitInput = BufferSource | WebAssembly.Module
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {SyncInitInput} module
 *
 * @returns {InitOutput}
 */
export function initSync(module: SyncInitInput): InitOutput

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {InitInput | Promise<InitInput>} module_or_path
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(
  module_or_path?: InitInput | Promise<InitInput>,
): Promise<InitOutput>
