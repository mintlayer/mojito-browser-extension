import { enforceTransactionBalance } from './DelegationWithdrawBalance'
import { getTransactionBINrepresentation } from './SignTransaction'
import { estimate_transaction_size } from '../../../services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js'

jest.mock('./SignTransaction', () => ({
  getTransactionBINrepresentation: jest.fn(() => ({ transactionsize: 182 })),
  mergeUint8Arrays: jest.fn((arrays) => {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
      result.set(arr, offset)
      offset += arr.length
    }
    return result
  }),
}))

jest.mock(
  '../../../services/Crypto/Mintlayer/@mintlayerlib-js/wasm_wrappers.js',
  () => ({
    estimate_transaction_size: jest.fn(() => 183),
  }),
)

// Regression cover for the @mintlayer/sdk buildTransaction fee-loop output
// aliasing (mintlayer-connect-sdk.ts:2540 shallow copy + :2542-2548 in-place
// DelegationWithdraw amount mutation): the loop re-subtracts every changed
// fee from the loop-shared output, committing an unbalanced transaction for
// withdrawal amounts whose fee-reduced encoding crosses a variable-width
// amount bucket (2^40 / 2^48 / 2^56 atoms).

const THRESHOLD_2_POW_40 = 1099511627776n
const FEE_PER_KB = 100000000000n

// Measured divergent value inside the window: 2^40 + 500000000.
const W_IN_DIVERGENT_WINDOW = 1100011627776n
// Above the window [2^40, 2^40 + fee): the SDK loop converges balanced.
const W_OUTSIDE_WINDOW = 1119511627776n
// Amount whose BALANCED encoding lands exactly back on 2^40 while the
// SDK's mutated encoding sat below it — the fee must grow to stay funded.
const W_STRADDLING_THRESHOLD = 1117711627776n

const DELEGATION_ID =
  'tdelg1d57nmkp24k0rh0fgsjnjy78wxql8wvgr420ncdsesvssvdgfcg6sx6262w'
const DESTINATION = 'tmt1q9874wgx6enm2mzfu0yxhzleu84pp00l95l7er5z'

// Faithful port of the SDK's DelegationWithdraw loop body
// (mintlayer-connect-sdk.ts:2494-2646) with the estimator's bucketing
// behaviour — empirical sizes of the vendored wasm encoders
// (estimate_transaction_size over a single-input/single-output withdrawal):
// 183 bytes at/above 2^40, 182 below. Re-measure with
// scripts/measure-withdrawal-size-buckets.mjs after any wasm upgrade.
const simulateSdkBuild = (withdrawalAtoms, { faithful = true } = {}) => {
  const sizeOf = (outputAtoms) =>
    outputAtoms >= THRESHOLD_2_POW_40 ? 183 : 182
  const outputs = [
    {
      type: 'LockThenTransfer',
      lock: { type: 'ForBlockCount', content: '7200' },
      destination: DESTINATION,
      value: {
        type: 'Coin',
        amount: { atoms: withdrawalAtoms.toString(), decimal: '11' },
      },
    },
  ]
  const withdrawalInput = () => ({
    input: {
      input_type: 'Account',
      account_type: 'DelegationBalance',
      amount: { atoms: withdrawalAtoms.toString(), decimal: '11' },
      delegation_id: DELEGATION_ID,
      nonce: 7,
    },
  })
  let preciseFee = 0n
  let previousFee = -1n
  for (let attempt = 1; attempt <= 10; attempt++) {
    const totalFee = preciseFee
    const finalOutputs = [...outputs] // shallow copy — element objects shared
    const out = finalOutputs[0]
    out.value.amount = {
      atoms: (
        (faithful ? BigInt(out.value.amount.atoms) : withdrawalAtoms) - totalFee
      ).toString(),
      decimal: '11',
    }
    const nextPreciseFee =
      (FEE_PER_KB * BigInt(sizeOf(BigInt(finalOutputs[0].value.amount.atoms))) +
        999n) /
      1000n
    if (nextPreciseFee === preciseFee || nextPreciseFee === previousFee) {
      return {
        attempts: attempt,
        JSONRepresentation: {
          inputs: [withdrawalInput()],
          outputs: finalOutputs,
          fee: { atoms: totalFee.toString(), decimal: '0.182' },
          id: 'to_be_filled_in',
        },
      }
    }
    previousFee = preciseFee
    preciseFee = nextPreciseFee
  }
  throw new Error('SDK simulation did not converge')
}

const bucketSizeEstimator = (json) =>
  BigInt(json.outputs[0].value.amount.atoms) >= THRESHOLD_2_POW_40 ? 183 : 182

const buildTransaction = ({ inputAtoms, outputAtoms, feeAtoms }) => ({
  JSONRepresentation: {
    inputs: [
      {
        input: {
          input_type: 'Account',
          account_type: 'DelegationBalance',
          amount: { atoms: inputAtoms.toString(), decimal: '11.00011627776' },
          delegation_id: DELEGATION_ID,
          nonce: 7,
        },
      },
    ],
    outputs: [
      {
        type: 'LockThenTransfer',
        lock: { type: 'ForBlockCount', content: '7200' },
        destination: DESTINATION,
        value: {
          type: 'Coin',
          amount: { atoms: outputAtoms.toString(), decimal: '10.63511627776' },
        },
      },
    ],
    fee: { atoms: feeAtoms.toString(), decimal: '0.182' },
    id: 'txid',
  },
  BINRepresentation: { inputs: [], outputs: [], transactionsize: 182 },
  HEXRepresentation_unsigned: 'abcd',
  transaction_id: 'txid',
})

const expectBalanced = (jsonRepresentation) => {
  const inputAtoms = BigInt(jsonRepresentation.inputs[0].input.amount.atoms)
  const outputAtoms = BigInt(jsonRepresentation.outputs[0].value.amount.atoms)
  const feeAtoms = BigInt(jsonRepresentation.fee.atoms)
  expect(inputAtoms).toBe(outputAtoms + feeAtoms)
}

describe('SDK fee-loop aliasing signature (loop simulation)', () => {
  test('reproduces the measured divergence inside the window', () => {
    const { attempts, JSONRepresentation } = simulateSdkBuild(
      W_IN_DIVERGENT_WINDOW,
    )
    expect(attempts).toBe(3)
    expect(JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1063511627776',
    )
    expect(JSONRepresentation.fee.atoms).toBe('18200000000')
    // The committed transaction is unbalanced: it debits the delegation for
    // W but pays out W - (18300000000 + 18200000000) with fee 18200000000.
    const inputAtoms = BigInt(JSONRepresentation.inputs[0].input.amount.atoms)
    const outputAtoms = BigInt(JSONRepresentation.outputs[0].value.amount.atoms)
    const feeAtoms = BigInt(JSONRepresentation.fee.atoms)
    expect(inputAtoms - outputAtoms - feeAtoms).toBe(18300000000n)
  })

  test('converges balanced outside the window', () => {
    const { attempts, JSONRepresentation } = simulateSdkBuild(W_OUTSIDE_WINDOW)
    expect(attempts).toBe(2)
    expect(JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1101211627776',
    )
    expect(JSONRepresentation.fee.atoms).toBe('18300000000')
    expectBalanced(JSONRepresentation)
  })
})

describe('enforceTransactionBalance', () => {
  test('repairs the aliasing signature to the intended W - fee withdrawal', () => {
    const unbalanced = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 18200000000n,
    })

    const { transaction, repaired } = enforceTransactionBalance(unbalanced, {
      estimateSize: bucketSizeEstimator,
    })

    expect(repaired).toBe(true)
    expectBalanced(transaction.JSONRepresentation)
    expect(transaction.JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1081811627776',
    )
    expect(transaction.JSONRepresentation.outputs[0].value.amount.decimal).toBe(
      '10.81811627776',
    )
    expect(transaction.JSONRepresentation.fee.atoms).toBe('18200000000')
    expect(transaction.JSONRepresentation.fee.decimal).toBe('0.182')
    // Non-amount fields survive untouched (signer re-encodes from the JSON).
    expect(transaction.transaction_id).toBe('txid')
    expect(transaction.JSONRepresentation.inputs[0].input.nonce).toBe(7)
    expect(transaction.JSONRepresentation.outputs[0].lock).toEqual({
      type: 'ForBlockCount',
      content: '7200',
    })
    expect(transaction.JSONRepresentation.outputs[0].destination).toBe(
      DESTINATION,
    )
    // The SDK-returned object is not mutated.
    expect(unbalanced.JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1063511627776',
    )
  })

  test('returns the SDK result untouched when it already converged balanced', () => {
    const balanced = buildTransaction({
      inputAtoms: W_OUTSIDE_WINDOW,
      outputAtoms: 1101211627776n,
      feeAtoms: 18300000000n,
    })

    const { transaction, repaired } = enforceTransactionBalance(balanced, {
      estimateSize: bucketSizeEstimator,
    })

    expect(repaired).toBe(false)
    expect(transaction).toBe(balanced)
    expect(getTransactionBINrepresentation).not.toHaveBeenCalled()
  })

  test('raises the fee when the balanced amount straddles a size bucket', () => {
    const unbalanced = buildTransaction({
      inputAtoms: W_STRADDLING_THRESHOLD,
      outputAtoms: 1081211627776n,
      feeAtoms: 18200000000n,
    })

    const { transaction, repaired } = enforceTransactionBalance(unbalanced, {
      estimateSize: bucketSizeEstimator,
    })

    expect(repaired).toBe(true)
    expectBalanced(transaction.JSONRepresentation)
    // withdrawal = W - 18300000000 = 2^40 - 100000000 (back below the bucket)
    expect(transaction.JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1099411627776',
    )
    expect(transaction.JSONRepresentation.fee.atoms).toBe('18300000000')
    expect(transaction.JSONRepresentation.fee.decimal).toBe('0.183')
  })

  test('fails closed when the delegation cannot cover the fee', () => {
    const underfunded = buildTransaction({
      inputAtoms: 1000000000n,
      outputAtoms: 0n,
      feeAtoms: 18200000000n,
    })

    expect(() =>
      enforceTransactionBalance(underfunded, {
        estimateSize: bucketSizeEstimator,
      }),
    ).toThrow('Delegation balance cannot cover the transaction fee')
  })

  test('fails closed when the fee never settles', () => {
    const unsettled = buildTransaction({
      inputAtoms: 1000000000000000000n,
      outputAtoms: 999999999999999999n,
      feeAtoms: 18200000000n,
    })
    let size = 100000
    const growingEstimator = jest.fn(() => {
      size += 1
      return size
    })

    expect(() =>
      enforceTransactionBalance(unsettled, { estimateSize: growingEstimator }),
    ).toThrow(
      'DelegationWithdraw fee did not settle to a balanced transaction — build aborted',
    )
    expect(growingEstimator).toHaveBeenCalledTimes(5)
  })

  test('falls back to the wallet encoders using the SDK witness convention', () => {
    getTransactionBINrepresentation.mockReturnValue({
      inputs: [new Uint8Array([1])],
      outputs: [new Uint8Array([2])],
      transactionsize: 79,
    })
    estimate_transaction_size.mockReturnValue(183)
    const unbalanced = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 10000000000n,
    })

    const { transaction, repaired } = enforceTransactionBalance(unbalanced, {
      networkType: 'testnet',
    })

    expect(repaired).toBe(true)
    expect(getTransactionBINrepresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        outputs: [
          expect.objectContaining({
            value: expect.objectContaining({
              amount: expect.objectContaining({ atoms: '1090011627776' }),
            }),
          }),
        ],
      }),
      1,
      0n,
    )
    // The withdrawal destination must feed the witness estimate exactly like
    // the SDK's estimator does (mintlayer-connect-sdk.ts DelegationBalance
    // first-input branch) — the bare estimate (79 here) would understate it.
    expect(estimate_transaction_size).toHaveBeenLastCalledWith(
      expect.any(Uint8Array),
      [DESTINATION],
      expect.any(Uint8Array),
      1,
    )
    expectBalanced(transaction.JSONRepresentation)
    expect(transaction.JSONRepresentation.outputs[0].value.amount.atoms).toBe(
      '1081711627776',
    )
    // required fee for the estimated size 183: ceil(100000000000 * 183 / 1000)
    expect(transaction.JSONRepresentation.fee.atoms).toBe('18300000000')
    expect(transaction.JSONRepresentation.fee.decimal).toBe('0.183')
  })

  test.each([
    ['missing JSON representation', null],
    ['empty inputs', { JSONRepresentation: { inputs: [], outputs: [] } }],
  ])('rejects %s', (_name, transaction) => {
    expect(() => enforceTransactionBalance(transaction)).toThrow(
      'DelegationWithdraw transaction',
    )
  })

  test('rejects non-delegation-balance inputs', () => {
    const transferLike = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 18200000000n,
    })
    transferLike.JSONRepresentation.inputs[0].input.account_type = 'Coin'

    expect(() => enforceTransactionBalance(transferLike)).toThrow(
      'delegation-balance input',
    )
  })

  test('rejects transactions with multiple outputs', () => {
    const multiOutput = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 18200000000n,
    })
    multiOutput.JSONRepresentation.outputs.push(
      multiOutput.JSONRepresentation.outputs[0],
    )

    expect(() => enforceTransactionBalance(multiOutput)).toThrow(
      'single output',
    )
  })

  test('rejects non-coin outputs', () => {
    const tokenOutput = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 18200000000n,
    })
    tokenOutput.JSONRepresentation.outputs[0].value.type = 'TokenV1'

    expect(() => enforceTransactionBalance(tokenOutput)).toThrow(
      'single coin output',
    )
  })

  test('rejects transactions without a fee', () => {
    const noFee = buildTransaction({
      inputAtoms: W_IN_DIVERGENT_WINDOW,
      outputAtoms: 1063511627776n,
      feeAtoms: 18200000000n,
    })
    delete noFee.JSONRepresentation.fee

    expect(() => enforceTransactionBalance(noFee)).toThrow(
      'carries no fee to verify',
    )
  })
})
