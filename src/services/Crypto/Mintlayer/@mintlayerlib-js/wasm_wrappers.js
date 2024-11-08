/* eslint-disable no-new-func */
/* eslint-disable eqeqeq */
/* eslint-disable no-restricted-globals */
/* eslint-disable max-depth */
/* eslint-disable no-undef */
/* eslint-disable max-params */
let wasm

const cachedTextDecoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true })
    : {
        decode: () => {
          throw Error('TextDecoder not available')
        },
      }

if (typeof TextDecoder !== 'undefined') {
  cachedTextDecoder.decode()
}

let cachedUint8ArrayMemory0 = null

function getUint8ArrayMemory0() {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer)
  }
  return cachedUint8ArrayMemory0
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  )
}

const heap = new Array(128).fill(undefined)

heap.push(undefined, null, true, false)

let heap_next = heap.length

function addHeapObject(obj) {
  if (heap_next === heap.length) heap.push(heap.length + 1)
  const idx = heap_next
  heap_next = heap[idx]

  heap[idx] = obj
  return idx
}

function getObject(idx) {
  return heap[idx]
}

function dropObject(idx) {
  if (idx < 132) return
  heap[idx] = heap_next
  heap_next = idx
}

function takeObject(idx) {
  const ret = getObject(idx)
  dropObject(idx)
  return ret
}

let WASM_VECTOR_LEN = 0

const cachedTextEncoder =
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder('utf-8')
    : {
        encode: () => {
          throw Error('TextEncoder not available')
        },
      }

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view)
      }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg)
        view.set(buf)
        return {
          read: arg.length,
          written: buf.length,
        }
      }

function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg)
    const ptr = malloc(buf.length, 1) >>> 0
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    WASM_VECTOR_LEN = buf.length
    return ptr
  }

  let len = arg.length
  let ptr = malloc(len, 1) >>> 0

  const mem = getUint8ArrayMemory0()

  let offset = 0

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset)
    if (code > 0x7f) break
    mem[ptr + offset] = code
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset)
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len)
    const ret = encodeString(arg, view)

    offset += ret.written
    ptr = realloc(ptr, len, offset, 1) >>> 0
  }

  WASM_VECTOR_LEN = offset
  return ptr
}

function isLikeNone(x) {
  return x === undefined || x === null
}

let cachedDataViewMemory0 = null

function getDataViewMemory0() {
  if (
    cachedDataViewMemory0 === null ||
    cachedDataViewMemory0.buffer.detached === true ||
    (cachedDataViewMemory0.buffer.detached === undefined &&
      cachedDataViewMemory0.buffer !== wasm.memory.buffer)
  ) {
    cachedDataViewMemory0 = new DataView(wasm.memory.buffer)
  }
  return cachedDataViewMemory0
}

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0
  getUint8ArrayMemory0().set(arg, ptr / 1)
  WASM_VECTOR_LEN = arg.length
  return ptr
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len)
}
/**
 * A utxo can either come from a transaction or a block reward.
 * Given a source id, whether from a block reward or transaction, this function
 * takes a generic id with it, and returns serialized binary data of the id
 * with the given source id.
 * @param {Uint8Array} id
 * @param {SourceId} source
 * @returns {Uint8Array}
 */
export function encode_outpoint_source_id(id, source) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(id, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_outpoint_source_id(retptr, ptr0, len0, source)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Generates a new, random private key from entropy
 * @returns {Uint8Array}
 */
export function make_private_key() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.make_private_key(retptr)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Create the default account's extended private key for a given mnemonic
 * derivation path: 44'/mintlayer_coin_type'/0'
 * @param {string} mnemonic
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function make_default_account_privkey(mnemonic, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      mnemonic,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    wasm.make_default_account_privkey(retptr, ptr0, len0, network)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * From an extended private key create a receiving private key for a given key index
 * derivation path: 44'/mintlayer_coin_type'/0'/0/key_index
 * @param {Uint8Array} private_key_bytes
 * @param {number} key_index
 * @returns {Uint8Array}
 */
export function make_receiving_address(private_key_bytes, key_index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.make_receiving_address(retptr, ptr0, len0, key_index)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * From an extended private key create a change private key for a given key index
 * derivation path: 44'/mintlayer_coin_type'/0'/1/key_index
 * @param {Uint8Array} private_key_bytes
 * @param {number} key_index
 * @returns {Uint8Array}
 */
export function make_change_address(private_key_bytes, key_index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.make_change_address(retptr, ptr0, len0, key_index)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a public key (as bytes) and a network type (mainnet, testnet, etc),
 * return the address public key hash from that public key as an address
 * @param {Uint8Array} public_key_bytes
 * @param {Network} network
 * @returns {string}
 */
export function pubkey_to_pubkeyhash_address(public_key_bytes, network) {
  let deferred3_0
  let deferred3_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(public_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.pubkey_to_pubkeyhash_address(retptr, ptr0, len0, network)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    var ptr2 = r0
    var len2 = r1
    if (r3) {
      ptr2 = 0
      len2 = 0
      throw takeObject(r2)
    }
    deferred3_0 = ptr2
    deferred3_1 = len2
    return getStringFromWasm0(ptr2, len2)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
    wasm.__wbindgen_free(deferred3_0, deferred3_1, 1)
  }
}

/**
 * Given a private key, as bytes, return the bytes of the corresponding public key
 * @param {Uint8Array} private_key
 * @returns {Uint8Array}
 */
export function public_key_from_private_key(private_key) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.public_key_from_private_key(retptr, ptr0, len0)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a message and a private key, sign the message with the given private key
 * This kind of signature is to be used when signing spend requests, such as transaction
 * input witness.
 * @param {Uint8Array} private_key
 * @param {Uint8Array} message
 * @returns {Uint8Array}
 */
export function sign_message_for_spending(private_key, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.sign_message_for_spending(retptr, ptr0, len0, ptr1, len1)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a digital signature, a public key and a message. Verify that
 * the signature is produced by signing the message with the private key
 * that derived the given public key.
 * Note that this function is used for verifying messages related to spending,
 * such as transaction input witness.
 * @param {Uint8Array} public_key
 * @param {Uint8Array} signature
 * @param {Uint8Array} message
 * @returns {boolean}
 */
export function verify_signature_for_spending(public_key, signature, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(public_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(signature, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    wasm.verify_signature_for_spending(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    if (r2) {
      throw takeObject(r1)
    }
    return r0 !== 0
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a message and a private key, create and sign a challenge with the given private key
 * This kind of signature is to be used when signing challenges.
 * @param {Uint8Array} private_key
 * @param {Uint8Array} message
 * @returns {Uint8Array}
 */
export function sign_challenge(private_key, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.sign_challenge(retptr, ptr0, len0, ptr1, len1)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a signed challenge, an address and a message. Verify that
 * the signature is produced by signing the message with the private key
 * that derived the given public key.
 * Note that this function is used for verifying messages related challenges.
 * @param {string} address
 * @param {Network} network
 * @param {Uint8Array} signed_challenge
 * @param {Uint8Array} message
 * @returns {boolean}
 */
export function verify_challenge(address, network, signed_challenge, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(signed_challenge, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    wasm.verify_challenge(retptr, ptr0, len0, network, ptr1, len1, ptr2, len2)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    if (r2) {
      throw takeObject(r1)
    }
    return r0 !== 0
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`)
  }
  return instance.ptr
}
/**
 * Given a destination address, an amount and a network type (mainnet, testnet, etc), this function
 * creates an output of type Transfer, and returns it as bytes.
 * @param {Amount} amount
 * @param {string} address
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_transfer(amount, address, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_transfer(retptr, ptr0, ptr1, len1, network)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a destination address, an amount, token ID (in address form) and a network type (mainnet, testnet, etc), this function
 * creates an output of type Transfer for tokens, and returns it as bytes.
 * @param {Amount} amount
 * @param {string} address
 * @param {string} token_id
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_token_transfer(
  amount,
  address,
  token_id,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passStringToWasm0(
      token_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len2 = WASM_VECTOR_LEN
    wasm.encode_output_token_transfer(
      retptr,
      ptr0,
      ptr1,
      len1,
      ptr2,
      len2,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v4 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v4
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this function returns the number of blocks, after which a pool that decommissioned,
 * will have its funds unlocked and available for spending.
 * The current block height information is used in case a network upgrade changed the value.
 * @param {bigint} current_block_height
 * @param {Network} network
 * @returns {bigint}
 */
export function staking_pool_spend_maturity_block_count(
  current_block_height,
  network,
) {
  const ret = wasm.staking_pool_spend_maturity_block_count(
    current_block_height,
    network,
  )
  return BigInt.asUintN(64, ret)
}

/**
 * Given a number of blocks, this function returns the output timelock
 * which is used in locked outputs to lock an output for a given number of blocks
 * since that output's transaction is included the blockchain
 * @param {bigint} block_count
 * @returns {Uint8Array}
 */
export function encode_lock_for_block_count(block_count) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_for_block_count(retptr, block_count)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a number of clock seconds, this function returns the output timelock
 * which is used in locked outputs to lock an output for a given number of seconds
 * since that output's transaction is included in the blockchain
 * @param {bigint} total_seconds
 * @returns {Uint8Array}
 */
export function encode_lock_for_seconds(total_seconds) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_for_seconds(retptr, total_seconds)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a timestamp represented by as unix timestamp, i.e., number of seconds since unix epoch,
 * this function returns the output timelock which is used in locked outputs to lock an output
 * until the given timestamp
 * @param {bigint} timestamp_since_epoch_in_seconds
 * @returns {Uint8Array}
 */
export function encode_lock_until_time(timestamp_since_epoch_in_seconds) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_until_time(retptr, timestamp_since_epoch_in_seconds)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a block height, this function returns the output timelock which is used in
 * locked outputs to lock an output until that block height is reached.
 * @param {bigint} block_height
 * @returns {Uint8Array}
 */
export function encode_lock_until_height(block_height) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_until_height(retptr, block_height)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a valid receiving address, and a locking rule as bytes (available in this file),
 * and a network type (mainnet, testnet, etc), this function creates an output of type
 * LockThenTransfer with the parameters provided.
 * @param {Amount} amount
 * @param {string} address
 * @param {Uint8Array} lock
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_lock_then_transfer(
  amount,
  address,
  lock,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(lock, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    wasm.encode_output_lock_then_transfer(
      retptr,
      ptr0,
      ptr1,
      len1,
      ptr2,
      len2,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v4 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v4
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a valid receiving address, token ID (in address form), a locking rule as bytes (available in this file),
 * and a network type (mainnet, testnet, etc), this function creates an output of type
 * LockThenTransfer with the parameters provided.
 * @param {Amount} amount
 * @param {string} address
 * @param {string} token_id
 * @param {Uint8Array} lock
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_token_lock_then_transfer(
  amount,
  address,
  token_id,
  lock,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passStringToWasm0(
      token_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passArray8ToWasm0(lock, wasm.__wbindgen_malloc)
    const len3 = WASM_VECTOR_LEN
    wasm.encode_output_token_lock_then_transfer(
      retptr,
      ptr0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v5 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v5
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given an amount, this function creates an output (as bytes) to burn a given amount of coins
 * @param {Amount} amount
 * @returns {Uint8Array}
 */
export function encode_output_coin_burn(amount) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    wasm.encode_output_coin_burn(retptr, ptr0)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given an amount, token ID (in address form) and network type (mainnet, testnet, etc),
 * this function creates an output (as bytes) to burn a given amount of tokens
 * @param {Amount} amount
 * @param {string} token_id
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_token_burn(amount, token_id, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      token_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_token_burn(retptr, ptr0, ptr1, len1, network)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a pool id as string, an owner address and a network type (mainnet, testnet, etc),
 * this function returns an output (as bytes) to create a delegation to the given pool.
 * The owner address is the address that is authorized to withdraw from that delegation.
 * @param {string} pool_id
 * @param {string} owner_address
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_create_delegation(
  pool_id,
  owner_address,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      pool_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      owner_address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_create_delegation(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a delegation id (as string, in address form), an amount and a network type (mainnet, testnet, etc),
 * this function returns an output (as bytes) that would delegate coins to be staked in the specified delegation id.
 * @param {Amount} amount
 * @param {string} delegation_id
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_delegate_staking(amount, delegation_id, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      delegation_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_delegate_staking(retptr, ptr0, ptr1, len1, network)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * This function returns the staking pool data needed to create a staking pool in an output as bytes,
 * given its parameters and the network type (testnet, mainnet, etc).
 * @param {Amount} value
 * @param {string} staker
 * @param {string} vrf_public_key
 * @param {string} decommission_key
 * @param {number} margin_ratio_per_thousand
 * @param {Amount} cost_per_block
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_stake_pool_data(
  value,
  staker,
  vrf_public_key,
  decommission_key,
  margin_ratio_per_thousand,
  cost_per_block,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(value, Amount)
    var ptr0 = value.__destroy_into_raw()
    const ptr1 = passStringToWasm0(
      staker,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passStringToWasm0(
      vrf_public_key,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passStringToWasm0(
      decommission_key,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len3 = WASM_VECTOR_LEN
    _assertClass(cost_per_block, Amount)
    var ptr4 = cost_per_block.__destroy_into_raw()
    wasm.encode_stake_pool_data(
      retptr,
      ptr0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      margin_ratio_per_thousand,
      ptr4,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v6 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v6
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a pool id, staking data as bytes and the network type (mainnet, testnet, etc),
 * this function returns an output that creates that staking pool.
 * Note that the pool id is mandated to be taken from the hash of the first input.
 * It is not arbitrary.
 * @param {string} pool_id
 * @param {Uint8Array} pool_data
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_create_stake_pool(pool_id, pool_data, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      pool_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(pool_data, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_create_stake_pool(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Returns the fee that needs to be paid by a transaction for issuing a new fungible token
 * @param {bigint} _current_block_height
 * @param {Network} network
 * @returns {Amount}
 */
export function fungible_token_issuance_fee(_current_block_height, network) {
  const ret = wasm.fungible_token_issuance_fee(_current_block_height, network)
  return Amount.__wrap(ret)
}

/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for issuing a new NFT
 * The current block height information is used in case a network upgrade changed the value.
 * @param {bigint} current_block_height
 * @param {Network} network
 * @returns {Amount}
 */
export function nft_issuance_fee(current_block_height, network) {
  const ret = wasm.nft_issuance_fee(current_block_height, network)
  return Amount.__wrap(ret)
}

/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for changing the total supply of a token
 * by either minting or unminting tokens
 * The current block height information is used in case a network upgrade changed the value.
 * @param {bigint} current_block_height
 * @param {Network} network
 * @returns {Amount}
 */
export function token_supply_change_fee(current_block_height, network) {
  const ret = wasm.token_supply_change_fee(current_block_height, network)
  return Amount.__wrap(ret)
}

/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for freezing/unfreezing a token
 * The current block height information is used in case a network upgrade changed the value.
 * @param {bigint} current_block_height
 * @param {Network} network
 * @returns {Amount}
 */
export function token_freeze_fee(current_block_height, network) {
  const ret = wasm.token_freeze_fee(current_block_height, network)
  return Amount.__wrap(ret)
}

/**
 * Given the current block height and a network type (mainnet, testnet, etc),
 * this will return the fee that needs to be paid by a transaction for changing the authority of a token
 * The current block height information is used in case a network upgrade changed the value.
 * @param {bigint} current_block_height
 * @param {Network} network
 * @returns {Amount}
 */
export function token_change_authority_fee(current_block_height, network) {
  const ret = wasm.token_change_authority_fee(current_block_height, network)
  return Amount.__wrap(ret)
}

/**
 * Given the parameters needed to issue a fungible token, and a network type (mainnet, testnet, etc),
 * this function creates an output that issues that token.
 * @param {string} authority
 * @param {Uint8Array} token_ticker
 * @param {Uint8Array} metadata_uri
 * @param {number} number_of_decimals
 * @param {TotalSupply} total_supply
 * @param {Amount | undefined} supply_amount
 * @param {FreezableToken} is_token_freezable
 * @param {bigint} _current_block_height
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_issue_fungible_token(
  authority,
  token_ticker,
  metadata_uri,
  number_of_decimals,
  total_supply,
  supply_amount,
  is_token_freezable,
  _current_block_height,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      authority,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(token_ticker, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(metadata_uri, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    let ptr3 = 0
    if (!isLikeNone(supply_amount)) {
      _assertClass(supply_amount, Amount)
      ptr3 = supply_amount.__destroy_into_raw()
    }
    wasm.encode_output_issue_fungible_token(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      number_of_decimals,
      total_supply,
      ptr3,
      is_token_freezable,
      _current_block_height,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v5 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v5
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given the parameters needed to issue an NFT, and a network type (mainnet, testnet, etc),
 * this function creates an output that issues that NFT.
 * @param {string} token_id
 * @param {string} authority
 * @param {string} name
 * @param {string} ticker
 * @param {string} description
 * @param {Uint8Array} media_hash
 * @param {string | undefined} creator
 * @param {Uint8Array | undefined} media_uri
 * @param {Uint8Array | undefined} icon_uri
 * @param {Uint8Array | undefined} additional_metadata_uri
 * @param {bigint} _current_block_height
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_issue_nft(
  token_id,
  authority,
  name,
  ticker,
  description,
  media_hash,
  creator,
  media_uri,
  icon_uri,
  additional_metadata_uri,
  _current_block_height,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      token_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      authority,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passStringToWasm0(
      name,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passStringToWasm0(
      ticker,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len3 = WASM_VECTOR_LEN
    const ptr4 = passStringToWasm0(
      description,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len4 = WASM_VECTOR_LEN
    const ptr5 = passArray8ToWasm0(media_hash, wasm.__wbindgen_malloc)
    const len5 = WASM_VECTOR_LEN
    var ptr6 = isLikeNone(creator)
      ? 0
      : passStringToWasm0(
          creator,
          wasm.__wbindgen_malloc,
          wasm.__wbindgen_realloc,
        )
    var len6 = WASM_VECTOR_LEN
    var ptr7 = isLikeNone(media_uri)
      ? 0
      : passArray8ToWasm0(media_uri, wasm.__wbindgen_malloc)
    var len7 = WASM_VECTOR_LEN
    var ptr8 = isLikeNone(icon_uri)
      ? 0
      : passArray8ToWasm0(icon_uri, wasm.__wbindgen_malloc)
    var len8 = WASM_VECTOR_LEN
    var ptr9 = isLikeNone(additional_metadata_uri)
      ? 0
      : passArray8ToWasm0(additional_metadata_uri, wasm.__wbindgen_malloc)
    var len9 = WASM_VECTOR_LEN
    wasm.encode_output_issue_nft(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      ptr4,
      len4,
      ptr5,
      len5,
      ptr6,
      len6,
      ptr7,
      len7,
      ptr8,
      len8,
      ptr9,
      len9,
      _current_block_height,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v11 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v11
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given data to be deposited in the blockchain, this function provides the output that deposits this data
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function encode_output_data_deposit(data) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_output_data_deposit(retptr, ptr0, len0)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given the parameters needed to create hash timelock contract, and a network type (mainnet, testnet, etc),
 * this function creates an output.
 * @param {Amount} amount
 * @param {string | undefined} token_id
 * @param {string} secret_hash
 * @param {string} spend_address
 * @param {string} refund_address
 * @param {Uint8Array} refund_timelock
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_htlc(
  amount,
  token_id,
  secret_hash,
  spend_address,
  refund_address,
  refund_timelock,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(amount, Amount)
    var ptr0 = amount.__destroy_into_raw()
    var ptr1 = isLikeNone(token_id)
      ? 0
      : passStringToWasm0(
          token_id,
          wasm.__wbindgen_malloc,
          wasm.__wbindgen_realloc,
        )
    var len1 = WASM_VECTOR_LEN
    const ptr2 = passStringToWasm0(
      secret_hash,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passStringToWasm0(
      spend_address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len3 = WASM_VECTOR_LEN
    const ptr4 = passStringToWasm0(
      refund_address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len4 = WASM_VECTOR_LEN
    const ptr5 = passArray8ToWasm0(refund_timelock, wasm.__wbindgen_malloc)
    const len5 = WASM_VECTOR_LEN
    wasm.encode_output_htlc(
      retptr,
      ptr0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      ptr4,
      len4,
      ptr5,
      len5,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v7 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v7
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a signed transaction and input outpoint that spends an htlc utxo, extract a secret that is
 * encoded in the corresponding input signature
 * @param {Uint8Array} signed_tx_bytes
 * @param {boolean} strict_byte_size
 * @param {Uint8Array} htlc_outpoint_source_id
 * @param {number} htlc_output_index
 * @returns {Uint8Array}
 */
export function extract_htlc_secret(
  signed_tx_bytes,
  strict_byte_size,
  htlc_outpoint_source_id,
  htlc_output_index,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(signed_tx_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(
      htlc_outpoint_source_id,
      wasm.__wbindgen_malloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.extract_htlc_secret(
      retptr,
      ptr0,
      len0,
      strict_byte_size,
      ptr1,
      len1,
      htlc_output_index,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given an output source id as bytes, and an output index, together representing a utxo,
 * this function returns the input that puts them together, as bytes.
 * @param {Uint8Array} outpoint_source_id
 * @param {number} output_index
 * @returns {Uint8Array}
 */
export function encode_input_for_utxo(outpoint_source_id, output_index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(outpoint_source_id, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_input_for_utxo(retptr, ptr0, len0, output_index)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a delegation id, an amount and a network type (mainnet, testnet, etc), this function
 * creates an input that withdraws from a delegation.
 * A nonce is needed because this spends from an account. The nonce must be in sequence for everything in that account.
 * @param {string} delegation_id
 * @param {Amount} amount
 * @param {bigint} nonce
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_input_for_withdraw_from_delegation(
  delegation_id,
  amount,
  nonce,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      delegation_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    _assertClass(amount, Amount)
    var ptr1 = amount.__destroy_into_raw()
    wasm.encode_input_for_withdraw_from_delegation(
      retptr,
      ptr0,
      len0,
      ptr1,
      nonce,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

function passArrayJsValueToWasm0(array, malloc) {
  const ptr = malloc(array.length * 4, 4) >>> 0
  const mem = getDataViewMemory0()
  for (let i = 0; i < array.length; i++) {
    mem.setUint32(ptr + 4 * i, addHeapObject(array[i]), true)
  }
  WASM_VECTOR_LEN = array.length
  return ptr
}
/**
 * Given the inputs, along each input's destination that can spend that input
 * (e.g. If we are spending a UTXO in input number 1 and it is owned by address mtc1xxxx, then it is mtc1xxxx in element number 2 in the vector/list.
 * for Account inputs that spend from a delegation it is the owning address of that delegation,
 * and in the case of AccountCommand inputs which change a token it is the token's authority destination)
 * and the outputs, estimate the transaction size.
 * ScriptHash and ClassicMultisig destinations are not supported.
 * @param {Uint8Array} inputs
 * @param {(string)[]} input_utxos_destinations
 * @param {Uint8Array} outputs
 * @param {Network} network
 * @returns {number}
 */
export function estimate_transaction_size(
  inputs,
  input_utxos_destinations,
  outputs,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(inputs, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArrayJsValueToWasm0(
      input_utxos_destinations,
      wasm.__wbindgen_malloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(outputs, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    wasm.estimate_transaction_size(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    if (r2) {
      throw takeObject(r1)
    }
    return r0 >>> 0
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given inputs as bytes, outputs as bytes, and flags settings, this function returns
 * the transaction that contains them all, as bytes.
 * @param {Uint8Array} inputs
 * @param {Uint8Array} outputs
 * @param {bigint} flags
 * @returns {Uint8Array}
 */
export function encode_transaction(inputs, outputs, flags) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(inputs, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(outputs, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.encode_transaction(retptr, ptr0, len0, ptr1, len1, flags)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Encode an input witness of the variant that contains no signature.
 * @returns {Uint8Array}
 */
export function encode_witness_no_signature() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_witness_no_signature(retptr)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a private key, inputs and an input number to sign, and the destination that owns that output (through the utxo),
 * and a network type (mainnet, testnet, etc), this function returns a witness to be used in a signed transaction, as bytes.
 * @param {SignatureHashType} sighashtype
 * @param {Uint8Array} private_key_bytes
 * @param {string} input_owner_destination
 * @param {Uint8Array} transaction_bytes
 * @param {Uint8Array} inputs
 * @param {number} input_num
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_witness(
  sighashtype,
  private_key_bytes,
  input_owner_destination,
  transaction_bytes,
  inputs,
  input_num,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      input_owner_destination,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(transaction_bytes, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passArray8ToWasm0(inputs, wasm.__wbindgen_malloc)
    const len3 = WASM_VECTOR_LEN
    wasm.encode_witness(
      retptr,
      sighashtype,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      input_num,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v5 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v5
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a private key, inputs and an input number to sign, and the destination that owns that output (through the utxo),
 * and a network type (mainnet, testnet, etc), and an htlc secret this function returns a witness to be used in a signed transaction, as bytes.
 * @param {SignatureHashType} sighashtype
 * @param {Uint8Array} private_key_bytes
 * @param {string} input_owner_destination
 * @param {Uint8Array} transaction_bytes
 * @param {Uint8Array} inputs
 * @param {number} input_num
 * @param {Uint8Array} secret
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_witness_htlc_secret(
  sighashtype,
  private_key_bytes,
  input_owner_destination,
  transaction_bytes,
  inputs,
  input_num,
  secret,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      input_owner_destination,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(transaction_bytes, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passArray8ToWasm0(inputs, wasm.__wbindgen_malloc)
    const len3 = WASM_VECTOR_LEN
    const ptr4 = passArray8ToWasm0(secret, wasm.__wbindgen_malloc)
    const len4 = WASM_VECTOR_LEN
    wasm.encode_witness_htlc_secret(
      retptr,
      sighashtype,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      input_num,
      ptr4,
      len4,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v6 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v6
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given an arbitrary number of public keys as bytes, number of minimum required signatures, and a network type, this function returns
 * the multisig challenge, as bytes.
 * @param {Uint8Array} public_keys_bytes
 * @param {number} min_required_signatures
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_multisig_challenge(
  public_keys_bytes,
  min_required_signatures,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(public_keys_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_multisig_challenge(
      retptr,
      ptr0,
      len0,
      min_required_signatures,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given a private key, inputs and an input number to sign, and multisig challenge,
 * and a network type (mainnet, testnet, etc), this function returns a witness to be used in a signed transaction, as bytes.
 *
 * `key_index` parameter is an index of a public key in the challenge, against which is the signature produces from private key is to be verified.
 * `input_witness` parameter can be either empty or a result of previous calls to this function.
 * @param {SignatureHashType} sighashtype
 * @param {Uint8Array} private_key_bytes
 * @param {number} key_index
 * @param {Uint8Array} input_witness
 * @param {Uint8Array} multisig_challenge
 * @param {Uint8Array} transaction_bytes
 * @param {Uint8Array} utxos
 * @param {number} input_num
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_witness_htlc_multisig(
  sighashtype,
  private_key_bytes,
  key_index,
  input_witness,
  multisig_challenge,
  transaction_bytes,
  utxos,
  input_num,
  network,
) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(input_witness, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(multisig_challenge, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    const ptr3 = passArray8ToWasm0(transaction_bytes, wasm.__wbindgen_malloc)
    const len3 = WASM_VECTOR_LEN
    const ptr4 = passArray8ToWasm0(utxos, wasm.__wbindgen_malloc)
    const len4 = WASM_VECTOR_LEN
    wasm.encode_witness_htlc_multisig(
      retptr,
      sighashtype,
      ptr0,
      len0,
      key_index,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      ptr4,
      len4,
      input_num,
      network,
    )
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v6 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v6
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * Given an unsigned transaction and signatures, this function returns a SignedTransaction object as bytes.
 * @param {Uint8Array} transaction_bytes
 * @param {Uint8Array} signatures
 * @returns {Uint8Array}
 */
export function encode_signed_transaction(transaction_bytes, signatures) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(transaction_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(signatures, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.encode_signed_transaction(retptr, ptr0, len0, ptr1, len1)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    if (r3) {
      throw takeObject(r2)
    }
    var v3 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v3
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

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
 * @param {Uint8Array} transaction_bytes
 * @param {boolean} strict_byte_size
 * @returns {string}
 */
export function get_transaction_id(transaction_bytes, strict_byte_size) {
  let deferred3_0
  let deferred3_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(transaction_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.get_transaction_id(retptr, ptr0, len0, strict_byte_size)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    var r3 = getDataViewMemory0().getInt32(retptr + 4 * 3, true)
    var ptr2 = r0
    var len2 = r1
    if (r3) {
      ptr2 = 0
      len2 = 0
      throw takeObject(r2)
    }
    deferred3_0 = ptr2
    deferred3_1 = len2
    return getStringFromWasm0(ptr2, len2)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
    wasm.__wbindgen_free(deferred3_0, deferred3_1, 1)
  }
}

/**
 * Calculate the "effective balance" of a pool, given the total pool balance and pledge by the pool owner/staker.
 * The effective balance is how the influence of a pool is calculated due to its balance.
 * @param {Network} network
 * @param {Amount} pledge_amount
 * @param {Amount} pool_balance
 * @returns {Amount}
 */
export function effective_pool_balance(network, pledge_amount, pool_balance) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    _assertClass(pledge_amount, Amount)
    var ptr0 = pledge_amount.__destroy_into_raw()
    _assertClass(pool_balance, Amount)
    var ptr1 = pool_balance.__destroy_into_raw()
    wasm.effective_pool_balance(retptr, network, ptr0, ptr1)
    var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
    var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
    var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true)
    if (r2) {
      throw takeObject(r1)
    }
    return Amount.__wrap(r0)
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

function handleError(f, args) {
  try {
    return f.apply(this, args)
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e))
  }
}
/**
 * A utxo can either come from a transaction or a block reward. This enum signifies that.
 */
export const SourceId = Object.freeze({
  Transaction: 0,
  0: 'Transaction',
  BlockReward: 1,
  1: 'BlockReward',
})
/**
 * The token supply of a specific token, set on issuance
 */
export const TotalSupply = Object.freeze({
  /**
   * Can be issued with no limit, but then can be locked to have a fixed supply.
   */
  Lockable: 0,
  0: 'Lockable',
  /**
   * Unlimited supply, no limits except for numeric limits due to u128
   */
  Unlimited: 1,
  1: 'Unlimited',
  /**
   * On issuance, the total number of coins is fixed
   */
  Fixed: 2,
  2: 'Fixed',
})
/**
 * The network, for which an operation to be done. Mainnet, testnet, etc.
 */
export const Network = Object.freeze({
  Mainnet: 0,
  0: 'Mainnet',
  Testnet: 1,
  1: 'Testnet',
  Regtest: 2,
  2: 'Regtest',
  Signet: 3,
  3: 'Signet',
})
/**
 * The part of the transaction that will be committed in the signature. Similar to bitcoin's sighash.
 */
export const SignatureHashType = Object.freeze({
  ALL: 0,
  0: 'ALL',
  NONE: 1,
  1: 'NONE',
  SINGLE: 2,
  2: 'SINGLE',
  ANYONECANPAY: 3,
  3: 'ANYONECANPAY',
})
/**
 * Indicates whether a token can be frozen
 */
export const FreezableToken = Object.freeze({
  No: 0,
  0: 'No',
  Yes: 1,
  1: 'Yes',
})

const AmountFinalization =
  typeof FinalizationRegistry === 'undefined'
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry((ptr) => wasm.__wbg_amount_free(ptr >>> 0, 1))
/**
 * Amount type abstraction. The amount type is stored in a string
 * since JavaScript number type cannot fit 128-bit integers.
 * The amount is given as an integer in units of "atoms".
 * Atoms are the smallest, indivisible amount of a coin or token.
 */
export class Amount {
  static __wrap(ptr) {
    ptr = ptr >>> 0
    const obj = Object.create(Amount.prototype)
    obj.__wbg_ptr = ptr
    AmountFinalization.register(obj, obj.__wbg_ptr, obj)
    return obj
  }

  __destroy_into_raw() {
    const ptr = this.__wbg_ptr
    this.__wbg_ptr = 0
    AmountFinalization.unregister(this)
    return ptr
  }

  free() {
    const ptr = this.__destroy_into_raw()
    wasm.__wbg_amount_free(ptr, 0)
  }
  /**
   * @param {string} atoms
   * @returns {Amount}
   */
  static from_atoms(atoms) {
    const ptr0 = passStringToWasm0(
      atoms,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ret = wasm.amount_from_atoms(ptr0, len0)
    return Amount.__wrap(ret)
  }
  /**
   * @returns {string}
   */
  atoms() {
    let deferred1_0
    let deferred1_1
    try {
      const ptr = this.__destroy_into_raw()
      const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
      wasm.amount_atoms(retptr, ptr)
      var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true)
      var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true)
      deferred1_0 = r0
      deferred1_1 = r1
      return getStringFromWasm0(r0, r1)
    } finally {
      wasm.__wbindgen_add_to_stack_pointer(16)
      wasm.__wbindgen_free(deferred1_0, deferred1_1, 1)
    }
  }
}

async function __wbg_load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports)
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            e,
          )
        } else {
          throw e
        }
      }
    }

    const bytes = await module.arrayBuffer()
    return await WebAssembly.instantiate(bytes, imports)
  } else {
    const instance = await WebAssembly.instantiate(module, imports)

    if (instance instanceof WebAssembly.Instance) {
      return { instance, module }
    } else {
      return instance
    }
  }
}

function __wbg_get_imports() {
  const imports = {}
  imports.wbg = {}
  imports.wbg.__wbindgen_string_new = function (arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1)
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
    takeObject(arg0)
  }
  imports.wbg.__wbg_crypto_1d1f22824a6a080c = function (arg0) {
    const ret = getObject(arg0).crypto
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_is_object = function (arg0) {
    const val = getObject(arg0)
    const ret = typeof val === 'object' && val !== null
    return ret
  }
  imports.wbg.__wbg_process_4a72847cc503995b = function (arg0) {
    const ret = getObject(arg0).process
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_versions_f686565e586dd935 = function (arg0) {
    const ret = getObject(arg0).versions
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_node_104a2ff8d6ea03a2 = function (arg0) {
    const ret = getObject(arg0).node
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_is_string = function (arg0) {
    const ret = typeof getObject(arg0) === 'string'
    return ret
  }
  imports.wbg.__wbg_require_cca90b1a94a0255b = function () {
    return handleError(function () {
      const ret = module.require
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbindgen_is_function = function (arg0) {
    const ret = typeof getObject(arg0) === 'function'
    return ret
  }
  imports.wbg.__wbg_msCrypto_eb05e62b530a1508 = function (arg0) {
    const ret = getObject(arg0).msCrypto
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_randomFillSync_5c9c955aa56b6049 = function () {
    return handleError(function (arg0, arg1) {
      getObject(arg0).randomFillSync(takeObject(arg1))
    }, arguments)
  }
  imports.wbg.__wbg_getRandomValues_3aa56aa6edec874c = function () {
    return handleError(function (arg0, arg1) {
      getObject(arg0).getRandomValues(getObject(arg1))
    }, arguments)
  }
  imports.wbg.__wbg_newnoargs_76313bd6ff35d0f2 = function (arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1))
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_call_1084a111329e68ce = function () {
    return handleError(function (arg0, arg1) {
      const ret = getObject(arg0).call(getObject(arg1))
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbindgen_string_get = function (arg0, arg1) {
    const obj = getObject(arg1)
    const ret = typeof obj === 'string' ? obj : undefined
    var ptr1 = isLikeNone(ret)
      ? 0
      : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc)
    var len1 = WASM_VECTOR_LEN
    getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true)
    getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true)
  }
  imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
    const ret = getObject(arg0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_self_3093d5d1f7bcb682 = function () {
    return handleError(function () {
      const ret = self.self
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_window_3bcfc4d31bc012f8 = function () {
    return handleError(function () {
      const ret = window.window
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_globalThis_86b222e13bdf32ed = function () {
    return handleError(function () {
      const ret = globalThis.globalThis
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_global_e5a3fe56f8be9485 = function () {
    return handleError(function () {
      const ret = global.global
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbindgen_is_undefined = function (arg0) {
    const ret = getObject(arg0) === undefined
    return ret
  }
  imports.wbg.__wbg_call_89af060b4e1523f2 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = getObject(arg0).call(getObject(arg1), getObject(arg2))
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_buffer_b7b08af79b0b0974 = function (arg0) {
    const ret = getObject(arg0).buffer
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_newwithbyteoffsetandlength_8a2cb9ca96b27ec9 = function (
    arg0,
    arg1,
    arg2,
  ) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_new_ea1883e1e5e86686 = function (arg0) {
    const ret = new Uint8Array(getObject(arg0))
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_set_d1e79e2388520f18 = function (arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0)
  }
  imports.wbg.__wbg_newwithlength_ec548f448387c968 = function (arg0) {
    const ret = new Uint8Array(arg0 >>> 0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_subarray_7c2e3576afe181d1 = function (arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_throw = function (arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1))
  }
  imports.wbg.__wbindgen_memory = function () {
    const ret = wasm.memory
    return addHeapObject(ret)
  }

  return imports
}

function __wbg_init_memory(imports, memory) {}

function __wbg_finalize_init(instance, module) {
  wasm = instance.exports
  __wbg_init.__wbindgen_wasm_module = module
  cachedDataViewMemory0 = null
  cachedUint8ArrayMemory0 = null

  return wasm
}

function initSync(module) {
  if (wasm !== undefined) return wasm

  if (
    typeof module !== 'undefined' &&
    Object.getPrototypeOf(module) === Object.prototype
  )
    ({ module } = module)
  else
    console.warn(
      'using deprecated parameters for `initSync()`; pass a single object instead',
    )

  const imports = __wbg_get_imports()

  __wbg_init_memory(imports)

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module)
  }

  const instance = new WebAssembly.Instance(module, imports)

  return __wbg_finalize_init(instance, module)
}

async function __wbg_init(module_or_path) {
  if (wasm !== undefined) return wasm

  if (
    typeof module_or_path !== 'undefined' &&
    Object.getPrototypeOf(module_or_path) === Object.prototype
  )
    ({ module_or_path } = module_or_path)
  else
    console.warn(
      'using deprecated parameters for the initialization function; pass a single object instead',
    )

  if (typeof module_or_path === 'undefined') {
    module_or_path = new URL('wasm_wrappers_bg.wasm', import.meta.url)
  }
  const imports = __wbg_get_imports()

  if (
    typeof module_or_path === 'string' ||
    (typeof Request === 'function' && module_or_path instanceof Request) ||
    (typeof URL === 'function' && module_or_path instanceof URL)
  ) {
    module_or_path = fetch(module_or_path)
  }

  __wbg_init_memory(imports)

  const { instance, module } = await __wbg_load(await module_or_path, imports)

  return __wbg_finalize_init(instance, module)
}

export { initSync }
export default __wbg_init
