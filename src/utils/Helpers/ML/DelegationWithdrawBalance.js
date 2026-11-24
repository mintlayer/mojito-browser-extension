import { estimate_transaction_size } from '../../../services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js'
import {
  getTransactionBINrepresentation,
  mergeUint8Arrays,
} from './SignTransaction'
import { getNetworkIndex } from '../../../services/Crypto/Mintlayer/Mintlayer'
import { atomsToDecimalString, COIN_DECIMALS } from './TransactionAmounts'

// SECURITY (SDK fee-loop output aliasing): the vendored @mintlayer/sdk
// buildTransaction fee-convergence loop shallow-copies its outputs array once
// per iteration (mintlayer-connect-sdk.ts `const finalOutputs = [...outputs]`)
// while its DelegationWithdraw branch rewrites `finalOutputs[0].value.amount`
// in place. Element objects stay shared across iterations, so every fee
// change during convergence subtracts the fee a second time. When the
// fee-reduced amount crosses a variable-width encoding bucket (2^40, 2^48 or
// 2^56 atoms) the estimated size drops mid-loop, the fee changes, and the
// committed transaction debits the delegation once but pays out
// `amount - Σfees` — inputs ≠ outputs + fee — while the preview understates
// the fee. The SDK builds the shared output internally (the wallet passes a
// scalar amount), so the aliasing cannot be pre-cloned at the call site.
// Instead every built withdrawal is re-verified here and repaired or
// rejected fail-closed. The signer re-encodes the transaction from
// JSONRepresentation with the same wallet encoders used below, so repairing
// that JSON is what the wallet actually signs and broadcasts; the SDK's
// prebuilt BIN/HEX/transaction_id fields are not consumed by this flow.
// SDK-exact DelegationWithdraw shape (getRequiredInputsOutputs): one
// Account/DelegationBalance input, one Coin output — fail closed on any
// other shape rather than mis-verify it.

// Mirror of the SDK's fee_amount_per_kb (mintlayer-connect-sdk.ts
// buildTransaction): 100000000000 atoms per kB, ceil-rounded per byte.
const ML_FEE_RATE_PER_KB = 100000000000n

// A bucket crossing needs at most one fee correction (fees grow monotonically
// while sizes shrink as the withdrawal decreases); an estimator that keeps
// demanding more is not settling and must fail closed.
const MAX_REPAIR_ATTEMPTS = 5

const isDelegationBalanceInput = (entry) => {
  const { input } = entry ?? {}
  return (
    input?.input_type === 'Account' &&
    input?.account_type === 'DelegationBalance' &&
    typeof input?.amount?.atoms === 'string'
  )
}

const feeForSize = (transactionsize) =>
  (ML_FEE_RATE_PER_KB * BigInt(Math.ceil(Number(transactionsize))) + 999n) /
  1000n

const sizeWithWalletEncoders = (jsonRepresentation, networkType) => {
  const network = getNetworkIndex(networkType)
  const { inputs, outputs } = getTransactionBINrepresentation(
    jsonRepresentation,
    network,
    0n,
  )
  // SDK size convention for account-input transactions: the withdrawal's
  // signature witness is estimated from the destination
  // (mintlayer-connect-sdk.ts pushes outputs[0].destination into
  // input_utxos_destinations for DelegationBalance first-inputs). The bare
  // estimate omits that witness (~103 bytes) and would understate the fee.
  return estimate_transaction_size(
    mergeUint8Arrays(inputs),
    [jsonRepresentation.outputs[0].destination],
    mergeUint8Arrays(outputs),
    network,
  )
}

const withdrawalAmount = (atoms) => ({
  atoms: atoms.toString(),
  decimal: atomsToDecimalString(atoms, COIN_DECIMALS),
})

/**
 * Verifies a built DelegationWithdraw transaction is balanced (inputs ==
 * outputs + fee) and fee-funded, repairing the SDK fee-loop aliasing
 * signature by re-deriving the withdrawal from the debited input amount and
 * the committed fee. Throws when the shape is not a plain withdrawal, the
 * delegation cannot cover the fee, or no balanced encoding settles.
 * @param {object} transaction - SDK buildTransaction result
 * @param {object} options
 * @param {string} options.networkType - 'mainnet' | 'testnet'
 * @param {function} [options.estimateSize] - size estimator seam for tests;
 *   defaults to the wallet's wasm-backed transaction-size estimator
 * @returns {{transaction: object, repaired: boolean}}
 */
export const enforceTransactionBalance = (
  transaction,
  { networkType = 'mainnet', estimateSize } = {},
) => {
  const jsonRepresentation = transaction?.JSONRepresentation

  if (
    !jsonRepresentation ||
    !Array.isArray(jsonRepresentation.inputs) ||
    !Array.isArray(jsonRepresentation.outputs)
  ) {
    throw new Error(
      'DelegationWithdraw transaction has no JSON representation to verify',
    )
  }
  if (jsonRepresentation.inputs.length !== 1) {
    throw new Error(
      'Expected a DelegationWithdraw transaction with a single delegation-balance input',
    )
  }
  if (!isDelegationBalanceInput(jsonRepresentation.inputs[0])) {
    throw new Error(
      'Expected a DelegationWithdraw transaction with a delegation-balance input',
    )
  }
  if (jsonRepresentation.outputs.length !== 1) {
    throw new Error(
      'Expected a DelegationWithdraw transaction with a single output',
    )
  }
  const [output] = jsonRepresentation.outputs
  if (
    output?.value?.type !== 'Coin' ||
    typeof output?.value?.amount?.atoms !== 'string'
  ) {
    throw new Error(
      'Expected a DelegationWithdraw transaction with a single coin output',
    )
  }
  if (typeof jsonRepresentation.fee?.atoms !== 'string') {
    throw new Error('DelegationWithdraw transaction carries no fee to verify')
  }

  const inputAtoms = BigInt(jsonRepresentation.inputs[0].input.amount.atoms)
  const feeAtoms = BigInt(jsonRepresentation.fee.atoms)
  const outputAtoms = BigInt(output.value.amount.atoms)

  // Healthy SDK convergence: nothing to repair, return the object as-is.
  if (inputAtoms === outputAtoms + feeAtoms) {
    return { transaction, repaired: false }
  }

  const sizeOf = (json) =>
    estimateSize
      ? estimateSize(json)
      : sizeWithWalletEncoders(json, networkType)

  let fee = feeAtoms
  for (let attempt = 0; attempt < MAX_REPAIR_ATTEMPTS; attempt++) {
    const withdrawal = inputAtoms - fee
    if (withdrawal <= 0n) {
      throw new Error('Delegation balance cannot cover the transaction fee')
    }

    const repairedJSON = {
      ...jsonRepresentation,
      outputs: [
        {
          ...output,
          value: {
            ...output.value,
            amount: withdrawalAmount(withdrawal),
          },
        },
      ],
    }

    const requiredFee = feeForSize(sizeOf(repairedJSON))
    if (requiredFee > fee) {
      // The repaired output needs a bigger fee than the loop committed
      // (amount straddles a size bucket): raise the fee monotonically.
      fee = requiredFee
      continue
    }

    return {
      transaction: {
        ...transaction,
        JSONRepresentation: {
          ...repairedJSON,
          fee:
            fee === feeAtoms
              ? jsonRepresentation.fee
              : {
                  atoms: fee.toString(),
                  decimal: atomsToDecimalString(fee, COIN_DECIMALS),
                },
        },
      },
      repaired: true,
    }
  }

  throw new Error(
    'DelegationWithdraw fee did not settle to a balanced transaction — build aborted',
  )
}
