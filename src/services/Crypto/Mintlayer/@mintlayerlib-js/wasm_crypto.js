/* eslint-disable no-new-func */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* eslint-disable max-depth */
/* eslint-disable eqeqeq */
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

let cachedUint8Memory0 = null

function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer)
  }
  return cachedUint8Memory0
}

function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len))
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

let cachedInt32Memory0 = null

function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer)
  }
  return cachedInt32Memory0
}

function getArrayU8FromWasm0(ptr, len) {
  ptr = ptr >>> 0
  return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len)
}
/**
 * @returns {Uint8Array}
 */
export function make_private_key() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.make_private_key(retptr)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
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
    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    WASM_VECTOR_LEN = buf.length
    return ptr
  }

  let len = arg.length
  let ptr = malloc(len, 1) >>> 0

  const mem = getUint8Memory0()

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
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len)
    const ret = encodeString(arg, view)

    offset += ret.written
  }

  WASM_VECTOR_LEN = offset
  return ptr
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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

function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0
  getUint8Memory0().set(arg, ptr / 1)
  WASM_VECTOR_LEN = arg.length
  return ptr
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {Uint8Array} public_key_bytes
 * @param {Network} network
 * @returns {string}
 */
export function pubkey_to_string(public_key_bytes, network) {
  let deferred3_0
  let deferred3_1
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(public_key_bytes, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.pubkey_to_string(retptr, ptr0, len0, network)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {Uint8Array} private_key
 * @returns {Uint8Array}
 */
export function public_key_from_private_key(private_key) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.public_key_from_private_key(retptr, ptr0, len0)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {Uint8Array} private_key
 * @param {Uint8Array} message
 * @returns {Uint8Array}
 */
export function sign_message(private_key, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(private_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    wasm.sign_message(retptr, ptr0, len0, ptr1, len1)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {Uint8Array} public_key
 * @param {Uint8Array} signature
 * @param {Uint8Array} message
 * @returns {boolean}
 */
export function verify_signature(public_key, signature, message) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(public_key, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passArray8ToWasm0(signature, wasm.__wbindgen_malloc)
    const len1 = WASM_VECTOR_LEN
    const ptr2 = passArray8ToWasm0(message, wasm.__wbindgen_malloc)
    const len2 = WASM_VECTOR_LEN
    wasm.verify_signature(retptr, ptr0, len0, ptr1, len1, ptr2, len2)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    if (r2) {
      throw takeObject(r1)
    }
    return r0 !== 0
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {string} amount
 * @param {string} address
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_transfer(amount, address, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      amount,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      address,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_transfer(retptr, ptr0, len0, ptr1, len1, network)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {bigint} num
 * @returns {Uint8Array}
 */
export function encode_lock_for_block_count(num) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_for_block_count(retptr, num)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {bigint} num
 * @returns {Uint8Array}
 */
export function encode_lock_for_seconds(num) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_for_seconds(retptr, num)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {bigint} num
 * @returns {Uint8Array}
 */
export function encode_lock_until_time(num) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_until_time(retptr, num)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {bigint} num
 * @returns {Uint8Array}
 */
export function encode_lock_until_height(num) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_lock_until_height(retptr, num)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {string} amount
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
    const ptr0 = passStringToWasm0(
      amount,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
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
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      network,
    )
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {string} amount
 * @returns {Uint8Array}
 */
export function encode_output_burn(amount) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      amount,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    wasm.encode_output_burn(retptr, ptr0, len0)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {string} pool_id
 * @param {string} address
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_create_delegation(pool_id, address, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      pool_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      address,
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {string} amount
 * @param {string} delegation_id
 * @param {Network} network
 * @returns {Uint8Array}
 */
export function encode_output_delegate_staking(amount, delegation_id, network) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passStringToWasm0(
      amount,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
    const ptr1 = passStringToWasm0(
      delegation_id,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len1 = WASM_VECTOR_LEN
    wasm.encode_output_delegate_staking(retptr, ptr0, len0, ptr1, len1, network)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {string} value
 * @param {string} staker
 * @param {string} vrf_public_key
 * @param {string} decommission_key
 * @param {number} margin_ratio_per_thousand
 * @param {string} cost_per_block
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
    const ptr0 = passStringToWasm0(
      value,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len0 = WASM_VECTOR_LEN
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
    const ptr4 = passStringToWasm0(
      cost_per_block,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len4 = WASM_VECTOR_LEN
    wasm.encode_stake_pool_data(
      retptr,
      ptr0,
      len0,
      ptr1,
      len1,
      ptr2,
      len2,
      ptr3,
      len3,
      margin_ratio_per_thousand,
      ptr4,
      len4,
      network,
    )
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {string} authority
 * @param {Uint8Array} token_ticker
 * @param {Uint8Array} metadata_uri
 * @param {number} number_of_decimals
 * @param {TotalSupply} total_supply
 * @param {string} supply_amount
 * @param {FreezableToken} is_token_freezable
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
    const ptr3 = passStringToWasm0(
      supply_amount,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    )
    const len3 = WASM_VECTOR_LEN
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
      len3,
      is_token_freezable,
      network,
    )
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
export function encode_output_data_deposit(data) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(data, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_output_data_deposit(retptr, ptr0, len0)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {Uint8Array} outpoint_source_id
 * @param {number} output_index
 * @returns {Uint8Array}
 */
export function encode_input_utxo(outpoint_source_id, output_index) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(outpoint_source_id, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_input_utxo(retptr, ptr0, len0, output_index)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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
 * @returns {Uint8Array}
 */
export function encode_witness_no_signature() {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    wasm.encode_witness_no_signature(retptr)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v1 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v1
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
 * @param {SignatureHashType} sighashtype
 * @param {Uint8Array} raw_signature
 * @returns {Uint8Array}
 */
export function encode_witness(sighashtype, raw_signature) {
  try {
    const retptr = wasm.__wbindgen_add_to_stack_pointer(-16)
    const ptr0 = passArray8ToWasm0(raw_signature, wasm.__wbindgen_malloc)
    const len0 = WASM_VECTOR_LEN
    wasm.encode_witness(retptr, sighashtype, ptr0, len0)
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var v2 = getArrayU8FromWasm0(r0, r1).slice()
    wasm.__wbindgen_free(r0, r1 * 1, 1)
    return v2
  } finally {
    wasm.__wbindgen_add_to_stack_pointer(16)
  }
}

/**
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
    var r0 = getInt32Memory0()[retptr / 4 + 0]
    var r1 = getInt32Memory0()[retptr / 4 + 1]
    var r2 = getInt32Memory0()[retptr / 4 + 2]
    var r3 = getInt32Memory0()[retptr / 4 + 3]
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

function handleError(f, args) {
  try {
    return f.apply(this, args)
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e))
  }
}
/**
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
 */
export const TotalSupply = Object.freeze({
  Lockable: 0,
  0: 'Lockable',
  Unlimited: 1,
  1: 'Unlimited',
  Fixed: 2,
  2: 'Fixed',
})
/**
 */
export const SourceId = Object.freeze({
  Transaction: 0,
  0: 'Transaction',
  BlockReward: 1,
  1: 'BlockReward',
})
/**
 */
export const FreezableToken = Object.freeze({
  No: 0,
  0: 'No',
  Yes: 1,
  1: 'Yes',
})

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
  imports.wbg.__wbg_crypto_c48a774b022d20ac = function (arg0) {
    const ret = getObject(arg0).crypto
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_is_object = function (arg0) {
    const val = getObject(arg0)
    const ret = typeof val === 'object' && val !== null
    return ret
  }
  imports.wbg.__wbg_process_298734cf255a885d = function (arg0) {
    const ret = getObject(arg0).process
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_versions_e2e78e134e3e5d01 = function (arg0) {
    const ret = getObject(arg0).versions
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_node_1cd7a5d853dbea79 = function (arg0) {
    const ret = getObject(arg0).node
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_is_string = function (arg0) {
    const ret = typeof getObject(arg0) === 'string'
    return ret
  }
  imports.wbg.__wbindgen_object_drop_ref = function (arg0) {
    takeObject(arg0)
  }
  imports.wbg.__wbg_require_8f08ceecec0f4fee = function () {
    return handleError(function () {
      const ret = module.require
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_msCrypto_bcb970640f50a1e8 = function (arg0) {
    const ret = getObject(arg0).msCrypto
    return addHeapObject(ret)
  }
  imports.wbg.__wbindgen_is_function = function (arg0) {
    const ret = typeof getObject(arg0) === 'function'
    return ret
  }
  imports.wbg.__wbg_randomFillSync_dc1e9a60c158336d = function () {
    return handleError(function (arg0, arg1) {
      getObject(arg0).randomFillSync(takeObject(arg1))
    }, arguments)
  }
  imports.wbg.__wbg_getRandomValues_37fa2ca9e4e07fab = function () {
    return handleError(function (arg0, arg1) {
      getObject(arg0).getRandomValues(getObject(arg1))
    }, arguments)
  }
  imports.wbg.__wbg_newnoargs_ccdcae30fd002262 = function (arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1))
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_call_669127b9d730c650 = function () {
    return handleError(function (arg0, arg1) {
      const ret = getObject(arg0).call(getObject(arg1))
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbindgen_object_clone_ref = function (arg0) {
    const ret = getObject(arg0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_self_3fad056edded10bd = function () {
    return handleError(function () {
      const ret = self.self
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_window_a4f46c98a61d4089 = function () {
    return handleError(function () {
      const ret = window.window
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_globalThis_17eff828815f7d84 = function () {
    return handleError(function () {
      const ret = globalThis.globalThis
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_global_46f939f6541643c5 = function () {
    return handleError(function () {
      const ret = global.global
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbindgen_is_undefined = function (arg0) {
    const ret = getObject(arg0) === undefined
    return ret
  }
  imports.wbg.__wbg_call_53fc3abd42e24ec8 = function () {
    return handleError(function (arg0, arg1, arg2) {
      const ret = getObject(arg0).call(getObject(arg1), getObject(arg2))
      return addHeapObject(ret)
    }, arguments)
  }
  imports.wbg.__wbg_buffer_344d9b41efe96da7 = function (arg0) {
    const ret = getObject(arg0).buffer
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_newwithbyteoffsetandlength_2dc04d99088b15e3 = function (
    arg0,
    arg1,
    arg2,
  ) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_new_d8a000788389a31e = function (arg0) {
    const ret = new Uint8Array(getObject(arg0))
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_set_dcfd613a3420f908 = function (arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0)
  }
  imports.wbg.__wbg_newwithlength_13b5319ab422dcf6 = function (arg0) {
    const ret = new Uint8Array(arg0 >>> 0)
    return addHeapObject(ret)
  }
  imports.wbg.__wbg_subarray_6ca5cfa7fbb9abbe = function (arg0, arg1, arg2) {
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

function __wbg_init_memory(imports, maybe_memory) {}

function __wbg_finalize_init(instance, module) {
  wasm = instance.exports
  __wbg_init.__wbindgen_wasm_module = module
  cachedInt32Memory0 = null
  cachedUint8Memory0 = null

  return wasm
}

function initSync(module) {
  if (wasm !== undefined) return wasm

  const imports = __wbg_get_imports()

  __wbg_init_memory(imports)

  if (!(module instanceof WebAssembly.Module)) {
    module = new WebAssembly.Module(module)
  }

  const instance = new WebAssembly.Instance(module, imports)

  return __wbg_finalize_init(instance, module)
}

async function __wbg_init(input) {
  if (wasm !== undefined) return wasm

  if (typeof input === 'undefined') {
    input = new URL('wasm_crypto_bg.wasm', import.meta.url)
  }
  const imports = __wbg_get_imports()

  if (
    typeof input === 'string' ||
    (typeof Request === 'function' && input instanceof Request) ||
    (typeof URL === 'function' && input instanceof URL)
  ) {
    input = fetch(input)
  }

  __wbg_init_memory(imports)

  const { instance, module } = await __wbg_load(await input, imports)

  return __wbg_finalize_init(instance, module)
}

export { initSync }
export default __wbg_init
