#!/usr/bin/env node
/**
 * Re-measures the variable-width amount-encoding buckets that the
 * DelegationWithdraw fee tests assert on
 * (src/utils/Helpers/ML/DelegationWithdrawBalance.test.js).
 *
 * The asserted sizes (182 bytes below 2^40 atoms, 183 at/above; 183 below
 * 2^48, 184 at/above) are empirical properties of the vendored wasm
 * encoders, not spec guarantees. Run this whenever the vendored wasm changes
 * (src/services/Crypto/Mintlayer/@mintlayerlib-js/) and update the test
 * constants if a bucket moved.
 *
 * Sizes are estimated exactly like the SDK's fee loop does for a
 * DelegationWithdraw: single Account/DelegationBalance input, single
 * LockThenTransfer coin output, with the withdrawal destination passed as
 * the witness source (input_utxos_destinations).
 *
 * Usage: node scripts/measure-withdrawal-size-buckets.mjs
 * Exits non-zero when the vendored wasm no longer matches the asserted
 * thresholds.
 */
import { readFileSync } from 'node:fs'
import init, {
  Amount,
  Network,
  encode_output_lock_then_transfer,
  encode_input_for_withdraw_from_delegation,
  encode_lock_for_block_count,
  estimate_transaction_size,
} from '../src/services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js'

await init({
  module_or_path: readFileSync(
    new URL(
      '../src/services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers_bg.wasm',
      import.meta.url,
    ),
  ),
})

const network = Network.Testnet
const DESTINATION = 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z'
const DELEGATION_ID =
  'tdelg1d57nmkp24k0rh0fgsjnjy78wxql8wvgr420ncdsesvssvdgfcg6sx6262w'
const FEE_RATE_PER_KB = 100000000000n

const inputBytes = encode_input_for_withdraw_from_delegation(
  DELEGATION_ID,
  Amount.from_atoms('1100011627776'),
  7n,
  network,
)

const sizeOf = (atoms) =>
  estimate_transaction_size(
    inputBytes,
    [DESTINATION],
    encode_output_lock_then_transfer(
      Amount.from_atoms(atoms.toString()),
      DESTINATION,
      encode_lock_for_block_count(7200n),
      network,
    ),
    network,
  )

const feeForSize = (size) => (FEE_RATE_PER_KB * BigInt(size) + 999n) / 1000n

const TWO_POW_40 = 2n ** 40n
const TWO_POW_48 = 2n ** 48n

// [amount atoms, expected estimated size] — the thresholds the fee tests
// assert on.
const EXPECTED = [
  [TWO_POW_40 - 1n, 182],
  [TWO_POW_40, 183],
  [TWO_POW_48 - 1n, 183],
  [TWO_POW_48, 184],
]

let drift = false
for (const [atoms, expected] of EXPECTED) {
  const size = sizeOf(atoms)
  const matches = Number(size) === expected
  drift = drift || !matches
  console.log(
    `${matches ? 'ok  ' : 'DRIFT'} amount=${atoms} size=${size} ` +
      `(expected ${expected}, fee ${feeForSize(size)} atoms)`,
  )
}

if (drift) {
  console.error(
    'Vendored wasm no longer matches the asserted size buckets — update the ' +
      'constants in src/utils/Helpers/ML/DelegationWithdrawBalance.test.js.',
  )
  process.exit(1)
}
console.log('Vendored wasm matches the asserted size buckets.')
