import { format } from 'date-fns'

import {
  COIN_DECIMALS,
  TOKEN_DECIMALS_LIMIT,
  atomsToDecimalString,
  buildTokenDecimalsIndex,
  computeCoinFeeAtoms,
  decimalMatchesAtoms,
  deriveApprovalFee,
  describeOutputLock,
  findRelevantOutputs,
  htlcOutputKeyOwnership,
  isLockedSelfOutput,
  readOutputLock,
  reconcileApprovalAmounts,
  resolveAssetDecimals,
  resolveCurrencyDecimals,
  signerAmountContainer,
  signerAmountScale,
  signerAmountTokenId,
  signerFillOrderDestination,
  signerUtxoOwnerAddress,
  verifyAmountPair,
  verifyDeclaredFee,
  ORDER_FILL_UNREADABLE_MESSAGE,
} from './TransactionAmounts'

const toAtoms = (decimal, decimals = 11) => {
  const [whole, fraction = ''] = String(decimal).split('.')
  const digits = (fraction + '0'.repeat(decimals)).slice(0, decimals)
  return `${whole}${digits}`.replace(/^(-?)0+(?=\d)/, '$1')
}

const coin = (decimal, atoms = toAtoms(decimal)) => ({
  type: 'Coin',
  amount: { decimal, atoms },
})

const coinOutput = (destination, decimal, atoms) => ({
  type: 'Transfer',
  destination,
  value: coin(decimal, atoms),
})

const coinInput = (destination, atoms, decimal) => ({
  input: { input_type: 'UTXO', source_id: 'src', index: 0 },
  input_type: 'UTXO',
  utxo: {
    destination,
    value: coin(decimal, atoms),
  },
})

// `value` wrapped in `depth` plain-object layers
const nestedBelow = (value, depth) => {
  let node = value
  for (let i = 0; i < depth; i++) node = { nested: node }
  return node
}

describe('atomsToDecimalString', () => {
  it('scales whole and fractional atom amounts exactly', () => {
    expect(atomsToDecimalString(2500000000000n, COIN_DECIMALS)).toBe('25')
    expect(atomsToDecimalString(1n, COIN_DECIMALS)).toBe('0.00000000001')
    expect(atomsToDecimalString(1707148604300000n, COIN_DECIMALS)).toBe(
      '17071.486043',
    )
    expect(atomsToDecimalString(2500n, 2)).toBe('25')
    expect(atomsToDecimalString(1000n, 2)).toBe('10')
    expect(atomsToDecimalString(0n, COIN_DECIMALS)).toBe('0')
  })

  it('keeps magnitudes beyond float precision exact', () => {
    const atoms = 340282366920938463463374607431768211455n // 2^128 − 1
    expect(atomsToDecimalString(atoms, 18)).toBe(
      '340282366920938463463.374607431768211455',
    )
  })

  it('rejects scales outside 0..18 instead of throwing RangeError or hanging', () => {
    for (const bad of [-1, NaN, 19, TOKEN_DECIMALS_LIMIT + 1, 1e11, 1.5]) {
      expect(() => atomsToDecimalString(1n, bad)).toThrow(RangeError)
    }
  })
})

describe('decimalMatchesAtoms', () => {
  it('accepts the exact scaled value regardless of notation or trailing zeros', () => {
    expect(decimalMatchesAtoms('17071.486043', 1707148604300000n, 11)).toBe(
      true,
    )
    expect(decimalMatchesAtoms('25.0', 2500000000000n, 11)).toBe(true)
    expect(decimalMatchesAtoms('1e+2', 10000000000000n, 11)).toBe(true)
    expect(decimalMatchesAtoms(10, 1000n, 2)).toBe(true)
  })

  it('rejects any other value, including rounding tricks', () => {
    // THE ATTACK: dApp reports "1" while the tx commits the full balance.
    expect(decimalMatchesAtoms('1', 1707148604300000n, COIN_DECIMALS)).toBe(
      false,
    )
    expect(decimalMatchesAtoms('25.00000000001', 2500000000000n, 11)).toBe(
      false,
    )
    expect(decimalMatchesAtoms('not-a-number', 2500000000000n, 11)).toBe(false)
    expect(decimalMatchesAtoms('', 0n, 11)).toBe(false)
    // more fractional places than the scale allows can never match
    expect(decimalMatchesAtoms('0.1', 0n, 0)).toBe(false)
  })

  it('rejects scales outside 0..18', () => {
    for (const bad of [-1, NaN, 19, 1e11]) {
      expect(() => decimalMatchesAtoms('1', 1n, bad)).toThrow(RangeError)
    }
  })
})

describe('buildTokenDecimalsIndex', () => {
  it('indexes chain metadata, skipping entries without usable decimals', () => {
    expect(
      buildTokenDecimalsIndex([
        { token_id: 'a', number_of_decimals: '2' },
        { token_id: 'b', number_of_decimals: 18 },
        { token_id: 'c', number_of_decimals: 'nope' },
        { number_of_decimals: 6 },
      ]),
    ).toEqual(
      new Map([
        ['a', 2],
        ['b', 18],
      ]),
    )
    expect(buildTokenDecimalsIndex(undefined)).toEqual(new Map())
  })

  it('drops out-of-range scales (negative, oversized, fractional) so they fail closed as unknown', () => {
    expect(
      buildTokenDecimalsIndex([
        { token_id: 'neg', number_of_decimals: -1 },
        { token_id: 'big', number_of_decimals: 19 },
        { token_id: 'huge', number_of_decimals: 1e11 },
        // fractional values truncate, matching the signer's own parseInt
        { token_id: 'frac', number_of_decimals: 2.5 },
        { token_id: 'ok', number_of_decimals: 0 },
      ]),
    ).toEqual(
      new Map([
        ['frac', 2],
        ['ok', 0],
      ]),
    )
  })
})

describe('resolveAssetDecimals', () => {
  it('uses coin scale for token-less values, chain data for tokens, null for unknown tokens', () => {
    expect(resolveAssetDecimals(undefined, new Map())).toBe(COIN_DECIMALS)
    expect(resolveAssetDecimals('a', new Map([['a', 2]]))).toBe(2)
    // unknown token: null scale → verbatim atom counts stay displayable, any
    // site-supplied decimal label fails closed as "scale cannot be verified"
    expect(resolveAssetDecimals('unknown', new Map())).toBe(null)
  })
})

describe('verifyAmountPair', () => {
  it('returns null when the container carries no numeric amount', () => {
    expect(verifyAmountPair({ type: 'DataDeposit', data: 'hello' }, 11)).toBe(
      null,
    )
    expect(verifyAmountPair(undefined, 11)).toBe(null)
  })

  it('returns the atoms-derived amount for a consistent pair', () => {
    expect(verifyAmountPair(coin('10', '1000000000000'), 11)).toEqual({
      atoms: 1000000000000n,
      amount: '10',
    })
  })

  it('returns the atoms-derived amount when no decimal label exists', () => {
    expect(
      verifyAmountPair({ type: 'Coin', amount: { atoms: '1000' } }, 2),
    ).toEqual({ atoms: 1000n, amount: '10' })
  })

  it('fails closed on a decimal that disagrees with the signed atoms', () => {
    const verified = verifyAmountPair(
      { type: 'Coin', amount: { decimal: '1', atoms: '1707148604300000' } },
      COIN_DECIMALS,
    )
    expect(verified.error).toMatch(/does not match/)
    // the truth is still surfaced for the user
    expect(verified.amount).toBe('17071.486043')
  })

  it('fails closed when the signed atoms are missing or unreadable', () => {
    expect(
      verifyAmountPair({ type: 'Coin', amount: { decimal: '1' } }, 11).error,
    ).toMatch(/cannot be verified/)
    expect(
      verifyAmountPair(
        { type: 'Coin', amount: { decimal: '1', atoms: 'x' } },
        11,
      ).error,
    ).toMatch(/cannot be verified/)
  })

  it('fails closed on negative atom amounts', () => {
    const verified = verifyAmountPair(
      { type: 'Coin', amount: { decimal: '-1', atoms: '-100000000000' } },
      COIN_DECIMALS,
    )
    expect(verified.error).toMatch(/cannot be negative/)
  })

  it('fails closed on invalid scales, even without a decimal label', () => {
    for (const bad of [-1, NaN, 19, 1e11]) {
      expect(
        verifyAmountPair({ type: 'Coin', amount: { atoms: '1000' } }, bad)
          .error,
      ).toMatch(/scale cannot be verified/)
    }
  })

  it('treats unknown token scales as verifiable only at raw atom count', () => {
    // no decimal label: the verbatim atom count is honest and shown
    expect(
      verifyAmountPair({ type: 'Coin', amount: { atoms: '91400' } }, null),
    ).toEqual({ atoms: 91400n, amount: '91400' })
    // label equal to the raw atom count: consistent, shown
    expect(
      verifyAmountPair(
        { type: 'Coin', amount: { decimal: '91400', atoms: '91400' } },
        null,
      ),
    ).toEqual({ atoms: 91400n, amount: '91400' })
    // a scaled label cannot be checked without the scale: distinct blocking error
    const verified = verifyAmountPair(
      { type: 'Coin', amount: { decimal: '914', atoms: '91400' } },
      null,
    )
    expect(verified.error).toMatch(/decimals are unknown/)
    expect(verified.amount).toBe('91400')
  })
})

describe('computeCoinFeeAtoms', () => {
  it('computes fee as coin input atoms minus coin output atoms', () => {
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '1707148604300000', '17071.486043')],
        [coinOutput('b', '10', '1000000000000')],
      ),
    ).toBe(1706148604300000n)
  })

  it('ignores token values but refuses to compute at all on unreadable coin atoms', () => {
    const tokenInput = {
      input_type: 'UTXO',
      utxo: {
        destination: 'a',
        value: { type: 'TokenV1', token_id: 't', amount: { atoms: '91400' } },
      },
    }
    expect(
      computeCoinFeeAtoms(
        [tokenInput, coinInput('a', '100000000000', '100')],
        [],
      ),
    ).toBe(100000000000n)
    expect(
      computeCoinFeeAtoms(
        [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: 'a', value: coin('100', 'garbage') },
          },
        ],
        [],
      ),
    ).toBeUndefined()
  })

  it('refuses sums containing negative coin atoms', () => {
    expect(
      computeCoinFeeAtoms(
        [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: 'a', value: coin('-1', '-100000000000') },
          },
        ],
        [],
      ),
    ).toBeUndefined()
  })

  it('returns null when there are no coin inputs to compute from', () => {
    expect(computeCoinFeeAtoms([], [coinOutput('b', '10', '1')])).toBe(null)
    expect(computeCoinFeeAtoms(undefined, undefined)).toBe(null)
  })

  it('subtracts DelegateStaking escrow from the fee', () => {
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'DelegateStaking',
            amount: { atoms: '10000000000000', decimal: '100' },
            delegation_id: 'd1',
          },
        ],
      ),
    ).toBe(1000000000n) // 0.01 ML — the escrow is not miner fee
  })

  it('subtracts the CreateOrder coin escrow (give side) from the fee', () => {
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'CreateOrder',
            ask_balance: { atoms: '1', decimal: '1' },
            ask_currency: { type: 'Coin' },
            give_balance: { atoms: '10000000000000', decimal: '100' },
            give_currency: { type: 'Coin' },
            conclude_destination: 'c',
          },
        ],
      ),
    ).toBe(1000000000n) // 0.01 ML
    // a token give side escrows tokens, not coin — ignored
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '100000000000', '100')],
        [
          {
            type: 'CreateOrder',
            ask_balance: { atoms: '1', decimal: '1' },
            ask_currency: { type: 'Coin' },
            give_balance: { atoms: '50000', decimal: '500' },
            give_currency: { type: 'Token', token_id: 't' },
            conclude_destination: 'c',
          },
        ],
      ),
    ).toBe(100000000000n)
  })

  it('credits a DelegationBalance withdraw as coin input', () => {
    expect(
      computeCoinFeeAtoms(
        [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              account_type: 'DelegationBalance',
              delegation_id: 'd1',
              amount: { atoms: '1000000000000', decimal: '10' },
              nonce: '0',
            },
          },
          coinInput('a', '150000000000', '1.5'),
        ],
        [coinOutput('b', '8', '800000000000')],
      ),
    ).toBe(350000000000n) // 10 + 1.5 − 8 = 3.5 ML
  })

  it('treats a coin burn as an output in the balance equation', () => {
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'BurnToken',
            value: coin('100'),
          },
        ],
      ),
    ).toBe(1000000000n) // 0.01 ML — destruction is not miner fee
  })

  it('keys currency decimals off token-id presence, not currency.type', () => {
    expect(resolveCurrencyDecimals({ type: 'Coin' }, new Map())).toBe(
      COIN_DECIMALS,
    )
    // self-contradictory currency: the signer escrows a token → token scale
    expect(
      resolveCurrencyDecimals(
        { type: 'Coin', token_id: 't' },
        new Map([['t', 2]]),
      ),
    ).toBe(2)
    expect(resolveCurrencyDecimals({ type: 'Coin' }, undefined)).toBe(
      COIN_DECIMALS,
    )
  })

  it('does not subtract a contradictory CreateOrder currency as coin', () => {
    // give_currency carries a token_id → the signer escrows a TOKEN; the
    // give balance must never be subtracted as coin
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '100000000000', '100')],
        [
          {
            type: 'CreateOrder',
            ask_currency: { type: 'Coin' },
            give_currency: { type: 'Coin', token_id: 't' },
            give_balance: { atoms: '50000', decimal: '500' },
            conclude_destination: 'c',
          },
        ],
      ),
    ).toBe(100000000000n)
  })

  it('does not skip real utxo coin on hybrid DelegationBalance inputs', () => {
    // input_type 'UTXO' + account_type DelegationBalance + amount 0: the
    // signer encodes the utxo coin leg (no known command), so the credit
    // branch must not swallow the real coin
    expect(
      computeCoinFeeAtoms(
        [
          {
            input: {
              input_type: 'UTXO',
              account_type: 'DelegationBalance',
              amount: { atoms: '0', decimal: '0' },
            },
            input_type: 'UTXO',
            utxo: {
              destination: 'a',
              value: {
                type: 'Coin',
                amount: { atoms: '100000000000', decimal: '100' },
              },
            },
          },
        ],
        [],
      ),
    ).toBe(100000000000n)
  })

  it('ignores withdrawal credits on known-command hybrids', () => {
    // a known command resolves before DelegationBalance in the signer — the
    // withdrawal credit must not fire for the hybrid shape
    expect(
      computeCoinFeeAtoms(
        [
          {
            input: {
              input_type: 'AccountCommand',
              command: 'UnmintTokens',
              account_type: 'DelegationBalance',
              amount: { atoms: '50000000000000', decimal: '500' },
              nonce: '0',
            },
          },
          coinInput('a', '100000000000', '100'),
        ],
        [],
      ),
    ).toBe(100000000000n)
  })

  it('ignores injected coin legs on shapes the signer does not encode', () => {
    // DataDeposit output with injected value.atoms must not understate the fee
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'DataDeposit',
            data: 'x',
            value: {
              type: 'Coin',
              amount: { atoms: '10000000000000', decimal: '100' },
            },
          },
        ],
      ),
    ).toBe(10001000000000n) // injected leg ignored — fee is the full input
    // injected utxo on an account command must not inflate the input sum
    expect(
      computeCoinFeeAtoms(
        [
          {
            input_type: 'AccountCommand',
            input: { command: 'UnmintTokens', token_id: 't', nonce: '0' },
            utxo: {
              value: {
                type: 'Coin',
                amount: { atoms: '50000000000000', decimal: '500' },
              },
            },
          },
          coinInput('a', '100000000000', '100'),
        ],
        [],
      ),
    ).toBe(100000000000n)
  })

  it('scales MintTokens amounts by the command-level token identity', () => {
    expect(
      signerAmountScale(
        {
          input: {
            input_type: 'AccountCommand',
            command: 'MintTokens',
            token_id: 't18',
          },
        },
        { atoms: '1500000000000000000', decimal: '1.5' },
        new Map([['t18', 18]]),
        'input',
      ),
    ).toBe(18)
    // coin-only shapes stay at coin scale even with an injected amount token_id
    expect(
      signerAmountScale(
        {
          type: 'DelegateStaking',
          amount: { atoms: '1000000000000', decimal: '1000', token_id: 't2' },
          delegation_id: 'd1',
        },
        { token_id: 't2' },
        new Map([['t2', 2]]),
        'output',
      ),
    ).toBe(COIN_DECIMALS)
  })

  it('resolves the MintTokens token identity from the command level', () => {
    const wrapper = {
      input: {
        input_type: 'AccountCommand',
        command: 'MintTokens',
        token_id: 't18',
        amount: {
          atoms: '1500000000000000000',
          decimal: '1.5',
          token_id: 'evil',
        },
      },
    }
    const container = signerAmountContainer(wrapper, 'input')
    expect(container).toEqual({
      atoms: '1500000000000000000',
      decimal: '1.5',
      token_id: 'evil',
    })
    // identity is the command-level token — the container's injected
    // token_id is ignored
    expect(signerAmountTokenId(wrapper, container, 'input')).toBe('t18')
  })

  it('marks order fill/conclusion legs as unverifiable instead of guessing', () => {
    for (const command of ['FillOrder', 'ConcludeOrder']) {
      expect(
        computeCoinFeeAtoms(
          [
            {
              input_type: 'AccountCommand',
              input: {
                input_type: 'AccountCommand',
                command,
                order_id: 'o1',
                nonce: '0',
              },
            },
            coinInput('a', '100000000000', '100'),
          ],
          [],
        ),
      ).toBeUndefined()
    }
  })

  it('renders Unknown for non-array legs instead of deriving a partial fee', () => {
    expect(deriveApprovalFee({ inputs: {}, outputs: [] })).toEqual({
      unknown: true,
    })
    expect(deriveApprovalFee({ inputs: [], outputs: 'x' })).toEqual({
      unknown: true,
    })
  })
})

describe('verifyDeclaredFee', () => {
  it('verifies the declared fee against its own atoms at coin scale', () => {
    expect(
      verifyDeclaredFee({ decimal: '0.01', atoms: toAtoms('0.01') }),
    ).toEqual({ atoms: 1000000000n, amount: '0.01' })
    expect(verifyDeclaredFee(undefined)).toBe(null)
  })

  it('fails closed with fee wording when the declared pair disagrees', () => {
    expect(
      verifyDeclaredFee({ decimal: '0.00000000001', atoms: '100000' }).error,
    ).toMatch(/fee does not match/)
  })

  it('uses fee wording for the unverifiable case too', () => {
    expect(verifyDeclaredFee({ decimal: '0.01' }).error).toMatch(
      /Fee cannot be verified/,
    )
  })
})

describe('deriveApprovalFee', () => {
  it('computes the fee from signed coin atom sums', () => {
    expect(
      deriveApprovalFee({
        inputs: [coinInput('a', '1000000000000', '10')],
        outputs: [coinOutput('b', '2.5', '250000000000')],
      }),
    ).toEqual({ amount: '7.5' })
  })

  it('renders a computed zero fee as 0 instead of the declared fee', () => {
    expect(
      deriveApprovalFee({
        inputs: [coinInput('a', '1000000000000', '10')],
        outputs: [coinOutput('b', '10', '1000000000000')],
        // self-consistent attacker fee must NOT replace the computed zero
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      }),
    ).toEqual({ amount: '0' })
  })

  it('renders a computed negative fee truthfully instead of the declared fee', () => {
    expect(
      deriveApprovalFee({
        inputs: [coinInput('a', '1000000000000', '10')],
        outputs: [coinOutput('b', '15', '1500000000000')],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      }),
    ).toEqual({ amount: '-5' })
  })

  it('falls back to the verified declared fee when the sums are not computable', () => {
    expect(
      deriveApprovalFee({
        inputs: [],
        outputs: [],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      }),
    ).toEqual({ amount: '0.01' })
    // nothing determinable at all (array legs, no coin, no declared fee)
    expect(deriveApprovalFee({ inputs: [], outputs: [] })).toBe(null)
  })

  it('fails closed on a declared fee that cannot be verified', () => {
    expect(
      deriveApprovalFee({
        inputs: [],
        outputs: [],
        fee: { decimal: 'x', atoms: 'y' },
      }).error,
    ).toMatch(/Fee cannot be verified/)
  })

  it('renders an unmodelable order-fill payload as Unknown, not the declared fee', () => {
    expect(
      deriveApprovalFee({
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'o1',
              fill_atoms: '10',
              nonce: '0',
            },
          },
        ],
        outputs: [],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      }),
    ).toEqual({ unknown: true })
  })
})

describe('findRelevantOutputs', () => {
  const ownAddresses = { receiving: ['wallet'], change: ['change'] }

  it('keeps every asset that pays out, not just the first input token', () => {
    const outputs = [
      coinOutput('attacker', '10', '1000000000000'),
      {
        type: 'Transfer',
        destination: 'attacker',
        value: {
          type: 'TokenV1',
          token_id: 't',
          amount: { decimal: '500', atoms: '50000' },
        },
      },
      coinOutput('change', '80', '8000000000000'),
    ]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(false)
    expect(relevant).toEqual([outputs[0], outputs[1]]) // own change excluded
  })

  it('falls back to receiving-address outputs for self-transfers', () => {
    const outputs = [
      coinOutput('wallet', '10', '1000000000000'),
      coinOutput('change', '80', '8000000000000'),
    ]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(true)
    expect(relevant).toEqual([outputs[0]]) // change excluded, payment kept
  })

  // The signer encodes `destination` for Transfer, LockThenTransfer and
  // CreateDelegationId outputs only. Every other output type moves its
  // funds elsewhere whatever address the payload attaches to it — an Htlc
  // pays to its spend/refund keys, a DelegateStaking escrows into its
  // delegation, a burn destroys them — so such an output is a payment even
  // when tagged with one of the wallet's own addresses.
  it.each([
    ['CreateOrder', { conclude_destination: 'attacker' }],
    ['BurnToken', {}],
    ['IssueFungibleToken', {}],
    ['DataDeposit', {}],
    ['DelegateStaking', { delegation_id: 'd1' }],
    ['Htlc', { htlc: { spend_key: 'attacker', refund_key: 'attacker' } }],
  ])(
    'keeps a %s output tagged with own addresses as a payment',
    (type, fields) => {
      const outputs = [
        coinOutput('attacker', '10', '1000000000000'),
        { type, ...fields, destination: 'wallet', address: 'change' },
      ]
      const { outputs: relevant, toSelf } = findRelevantOutputs(
        outputs,
        ownAddresses,
      )
      expect(toSelf).toBe(false)
      expect(relevant).toEqual(outputs)
    },
  )

  it('never honours `address`, on any output type', () => {
    const outputs = [
      coinOutput('attacker', '10', '1000000000000'),
      // a destination-bearing type addressed through `address` only
      { type: 'Transfer', address: 'wallet', value: coin('5') },
      // an own `address` next to a foreign destination
      { ...coinOutput('attacker', '1'), address: 'wallet' },
      {
        type: 'LockThenTransfer',
        address: 'wallet',
        lock: { type: 'ForBlockCount', content: 1 },
        value: coin('1'),
      },
      { type: 'CreateDelegationId', address: 'wallet', pool_id: 'pool' },
    ]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(false)
    expect(relevant).toEqual(outputs)
  })

  it('excludes Transfer, LockThenTransfer and CreateDelegationId to own addresses as change', () => {
    const payment = coinOutput('attacker', '10')
    const outputs = [
      coinOutput('wallet', '1'),
      coinOutput('change', '2'),
      {
        type: 'LockThenTransfer',
        destination: 'change',
        lock: { type: 'ForBlockCount', content: 1 },
        value: coin('3'),
      },
      { type: 'CreateDelegationId', destination: 'wallet', pool_id: 'pool' },
      payment,
    ]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(false)
    expect(relevant).toEqual([payment])
  })

  it('keeps the self-transfer branch for outputs that genuinely target the wallet', () => {
    const toReceiving = coinOutput('wallet', '10')
    const delegation = {
      type: 'CreateDelegationId',
      destination: 'wallet',
      pool_id: 'pool',
    }
    const outputs = [
      toReceiving,
      coinOutput('change', '80'),
      delegation,
      {
        type: 'LockThenTransfer',
        destination: 'change',
        lock: { type: 'ForBlockCount', content: 1 },
        value: coin('5'),
      },
    ]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(true)
    // change excluded, payments to receiving addresses kept
    expect(relevant).toEqual([toReceiving, delegation])
  })

  it('leaves the self-transfer branch as soon as one output type ignores destination', () => {
    const escrow = {
      type: 'Htlc',
      destination: 'wallet',
      value: coin('5'),
      htlc: { spend_key: 'attacker', refund_key: 'attacker' },
    }
    const outputs = [coinOutput('wallet', '10'), escrow]
    const { outputs: relevant, toSelf } = findRelevantOutputs(
      outputs,
      ownAddresses,
    )
    expect(toSelf).toBe(false)
    // the transfer to the wallet is change; the escrow leaves the wallet
    expect(relevant).toEqual([escrow])
  })
})

describe('signer leg-kind-aware amount resolution', () => {
  it('never consults the account/command branches for outputs', () => {
    // THE ATTACK: an output with injected input_type/command/account_type
    // plus a self-consistent amount would display funds the signer never
    // encodes — the signer reads command/account_type on inputs only
    const injection = {
      type: 'CreateDelegationId',
      pool_id: 'p1',
      input_type: 'AccountCommand',
      command: 'MintTokens',
      token_id: 'tmltk1cheap',
      account_type: 'DelegationBalance',
      amount: { atoms: '2500', decimal: '25' },
    }
    expect(signerAmountContainer(injection, 'output')).toBe(null)
    expect(signerAmountTokenId(injection, null, 'output')).toBe(null)
    // the real output branches still resolve
    const transfer = {
      type: 'Transfer',
      value: { type: 'Coin', amount: { atoms: '1' } },
    }
    expect(signerAmountContainer(transfer, 'output')).toBe(transfer.value)
    const staking = {
      type: 'DelegateStaking',
      amount: { atoms: '2' },
      delegation_id: 'd1',
    }
    expect(signerAmountContainer(staking, 'output')).toBe(staking.amount)
    expect(signerAmountTokenId(staking, staking.amount, 'output')).toBe(null)
    expect(
      signerAmountScale(staking, staking.amount, new Map(), 'output'),
    ).toBe(COIN_DECIMALS)
  })

  it('never consults the value-type branches for inputs', () => {
    // an account input injected with type 'Transfer' (+ value) must not
    // resolve the injected value, and one injected with type
    // 'DelegateStaking' (+ amount) must not resolve the amount — the signer
    // reads utxo.value only for input_type 'UTXO' legs
    const transferImpersonator = {
      input: {
        input_type: 'AccountCommand',
        command: 'ConcludeOrder',
        order_id: 'o1',
        nonce: '0',
        type: 'Transfer',
        value: {
          type: 'Coin',
          amount: { atoms: '1000000000000', decimal: '10' },
        },
      },
    }
    expect(signerAmountContainer(transferImpersonator, 'input')).toBe(null)
    const stakingImpersonator = {
      input: {
        input_type: 'Account',
        account_type: 'ExternalKey',
        nonce: '0',
        type: 'DelegateStaking',
        amount: { atoms: '1000000000000', decimal: '10' },
      },
    }
    expect(signerAmountContainer(stakingImpersonator, 'input')).toBe(null)
    // resolution is per leg kind, never shape-only: the same injected shape
    // resolves as an output (where type 'DelegateStaking' IS signed)
    expect(signerAmountContainer(stakingImpersonator.input, 'output')).toBe(
      stakingImpersonator.input.amount,
    )
  })

  it('reads utxo.value only for input_type UTXO legs of signed types', () => {
    const value = {
      type: 'Coin',
      amount: { atoms: '150000000000', decimal: '1.5' },
    }
    expect(
      signerAmountContainer(
        { input: { input_type: 'UTXO' }, utxo: { type: 'Transfer', value } },
        'input',
      ),
    ).toBe(value)
    expect(
      signerAmountContainer(
        { input: { input_type: 'UTXO' }, utxo: { type: 'Htlc', value } },
        'input',
      ),
    ).toBe(value)
    expect(
      signerAmountContainer(
        { input: { input_type: 'UTXO' }, utxo: { type: 'IssueNft', value } },
        'input',
      ),
    ).toBe(null)
    // account fields injected ON the utxo object never redirect the
    // resolution — a UTXO leg's container comes from utxo.value alone
    const evil = {
      input: { input_type: 'UTXO' },
      utxo: {
        type: 'Transfer',
        input_type: 'AccountCommand',
        command: 'MintTokens',
        token_id: 'tmltk1evil',
        amount: { atoms: '999', decimal: '999' },
        value,
      },
    }
    expect(signerAmountContainer(evil, 'input')).toBe(value)
    // utxo identity comes from the signer-read container
    expect(signerAmountTokenId(evil, value, 'input')).toBe(null)
  })

  it('resolves account-command containers from the wrapper input', () => {
    const mint = {
      input_type: 'AccountCommand',
      command: 'MintTokens',
      token_id: 't2',
      amount: { atoms: '2500', decimal: '25' },
      nonce: '0',
    }
    expect(signerAmountContainer({ input: mint }, 'input')).toBe(mint.amount)
    expect(signerAmountTokenId({ input: mint }, mint.amount, 'input')).toBe(
      't2',
    )
    expect(
      signerAmountScale(
        { input: mint },
        mint.amount,
        new Map([['t2', 2]]),
        'input',
      ),
    ).toBe(2)
    const withdraw = {
      input_type: 'Account',
      account_type: 'DelegationBalance',
      delegation_id: 'd1',
      amount: { atoms: '1000000000000', decimal: '10', token_id: 'evil' },
      nonce: '0',
    }
    expect(signerAmountContainer({ input: withdraw }, 'input')).toBe(
      withdraw.amount,
    )
    // withdrawals are coin-only, whatever identity is injected
    expect(
      signerAmountTokenId({ input: withdraw }, withdraw.amount, 'input'),
    ).toBe(null)
    expect(
      signerAmountScale(
        { input: withdraw },
        withdraw.amount,
        new Map(),
        'input',
      ),
    ).toBe(COIN_DECIMALS)
  })

  it('fails closed without an explicit legKind', () => {
    const transfer = {
      type: 'Transfer',
      value: { type: 'Coin', amount: { atoms: '1' } },
    }
    const mint = {
      input: {
        input_type: 'AccountCommand',
        command: 'MintTokens',
        token_id: 't',
        amount: { atoms: '1' },
      },
    }
    // a call site that skipped the legKind parameter resolves nothing
    expect(signerAmountContainer(transfer)).toBe(null)
    expect(signerAmountContainer(mint)).toBe(null)
    expect(signerAmountTokenId(mint, mint.input.amount)).toBe(null)
    expect(signerAmountScale(transfer, transfer.value, new Map())).toBe(null)
  })
})

describe('signer-read input addresses', () => {
  const ownAddresses = { receiving: ['wallet'], change: ['change'] }
  const htlcUtxo = (keys) => ({
    type: 'Htlc',
    value: coin('10'),
    htlc: keys,
  })

  // An Htlc utxo carries no destination: the signer signs it with the key
  // of its spend key (a claim) or else of its refund key.
  it.each([
    ['spend_key', { spend_key: 'wallet', refund_key: 'attacker' }, 'wallet'],
    ['refund_key', { spend_key: 'attacker', refund_key: 'change' }, 'change'],
    // the signer prefers the spend key when the wallet holds both
    [
      'spend_key ahead of an owned refund_key',
      { spend_key: 'change', refund_key: 'wallet' },
      'change',
    ],
  ])(
    'resolves the owner of an Htlc utxo from its %s',
    (_field, keys, expected) => {
      expect(signerUtxoOwnerAddress(htlcUtxo(keys), ownAddresses)).toBe(
        expected,
      )
    },
  )

  it('never resolves an Htlc utxo owner from its destination', () => {
    // the signer signs an Htlc utxo with a spend/refund key only
    expect(
      signerUtxoOwnerAddress(
        htlcUtxo({
          destination: 'wallet',
          address: 'wallet',
          spend_key: 'attacker',
          refund_key: 'attacker',
        }),
        ownAddresses,
      ),
    ).toBe(null)
    expect(
      signerUtxoOwnerAddress(
        htlcUtxo({ spend_key: 42, refund_key: { toString: 1 } }),
        ownAddresses,
      ),
    ).toBe(null)
    expect(signerUtxoOwnerAddress({ type: 'Htlc' }, ownAddresses)).toBe(null)
  })

  it('resolves any other utxo from its string destination, never `address`', () => {
    expect(
      signerUtxoOwnerAddress(
        { type: 'Transfer', destination: 'wallet' },
        ownAddresses,
      ),
    ).toBe('wallet')
    expect(
      signerUtxoOwnerAddress(
        { type: 'Transfer', destination: 'attacker' },
        ownAddresses,
      ),
    ).toBe(null)
    expect(
      signerUtxoOwnerAddress(
        { type: 'Transfer', address: 'wallet' },
        ownAddresses,
      ),
    ).toBe(null)
    expect(
      signerUtxoOwnerAddress(
        { type: 'Transfer', destination: { toString: 1 } },
        ownAddresses,
      ),
    ).toBe(null)
    expect(signerUtxoOwnerAddress(null, ownAddresses)).toBe(null)
    // an Htlc utxo without its keys, and no own addresses at all
    expect(signerUtxoOwnerAddress({ type: 'Htlc' }, undefined)).toBe(null)
  })

  // The signer encodes `destination` on an account-command FillOrder input
  // (where the acquired asset lands) and on no other input shape.
  it('reads a FillOrder destination only as a string on an account command', () => {
    const leg = (input) => ({ input })
    expect(
      signerFillOrderDestination(
        leg({
          input_type: 'AccountCommand',
          command: 'FillOrder',
          destination: 'dApp',
        }),
      ),
    ).toBe('dApp')
    expect(
      signerFillOrderDestination(
        leg({
          input_type: 'Account',
          command: 'FillOrder',
          destination: 'dApp',
        }),
      ),
    ).toBe('dApp')
    for (const input of [
      { input_type: 'AccountCommand', command: 'FillOrder', destination: 42 },
      { input_type: 'AccountCommand', command: 'FillOrder', address: 'dApp' },
      {
        input_type: 'AccountCommand',
        command: 'ConcludeOrder',
        destination: 'dApp',
      },
      { input_type: 'UTXO', command: 'FillOrder', destination: 'dApp' },
      { command: 'FillOrder', destination: 'dApp' },
    ]) {
      expect(signerFillOrderDestination(leg(input))).toBe(null)
    }
    expect(signerFillOrderDestination(null)).toBe(null)
  })
})

describe('reconcileApprovalAmounts', () => {
  const ownAddresses = { receiving: ['wallet'], change: ['change'] }

  // One destination group of the approval: the destination the signer
  // encodes (null when it reads `destination` on none of the group's
  // outputs) and the per-asset rows summed over exactly those outputs.
  const pair = (destination, amountRows, toSelf = false) => ({
    destination,
    toSelf,
    amountRows,
  })

  it('derives amounts and fee from atoms for a consistent transfer', () => {
    const { destinationRows, fee, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [coinOutput('tmt1qrecipient', '10', '1000000000000')],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(destinationRows).toEqual([
      pair('tmt1qrecipient', [{ key: 'Coin', tokenId: null, amount: '10' }]),
    ])
    // 17071.486043 − 10 = 17061.486043
    expect(fee).toEqual({ amount: '17061.486043' })
    expect(blocked).toBe(false)
  })

  it('blocks when an approved output reports a smaller decimal than its atoms', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'attacker',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '1707148604300000' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(destinationRows[0].amountRows[0].errors[0].error).toMatch(
      /does not match/,
    )
    expect(destinationRows[0].amountRows[0].errors[0].amount).toBe(
      '17071.486043',
    )
  })

  it('groups rows by every output asset for mixed coin+token payments', () => {
    const tokenId = 'token-a'
    const { destinationRows, fee, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          coinInput('wallet', '10000000000000', '100'),
          {
            input: { input_type: 'UTXO', source_id: 'src', index: 1 },
            utxo: {
              destination: 'wallet',
              value: {
                type: 'TokenV1',
                token_id: tokenId,
                amount: { decimal: '914', atoms: '91400' },
              },
            },
          },
        ],
        outputs: [
          // token payment to the recipient
          {
            type: 'Transfer',
            destination: 'attacker',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { decimal: '500', atoms: '50000' },
            },
          },
          // coin payment to the recipient …
          coinOutput('attacker', '10', '1000000000000'),
          // … and the coin change back to the wallet (never a "payment")
          coinOutput('change', '80', '8000000000000'),
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('attacker', [
        { key: tokenId, tokenId, amount: '500' },
        { key: 'Coin', tokenId: null, amount: '10' },
      ]),
    ])
    // 100 − 10 − 80 = 10 ML fee (token values are not coin)
    expect(fee).toEqual({ amount: '10' })
  })

  it('surfaces every mismatching output on its own destination row', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'attacker1',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '1000000000000' },
            },
          },
          {
            type: 'Transfer',
            destination: 'attacker2',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '2000000000000' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(destinationRows).toHaveLength(2)
    expect(destinationRows[0].destination).toBe('attacker1')
    expect(destinationRows[0].amountRows[0].errors[0].amount).toBe('10')
    expect(destinationRows[1].destination).toBe('attacker2')
    expect(destinationRows[1].amountRows[0].errors[0].amount).toBe('20')
  })

  // One group per distinct destination, in the order the transaction
  // declares its outputs: naming one recipient beside a summed amount would
  // present other destinations' money as theirs, and a zero-amount output
  // would make the decoy read exactly like the payment it imitates.
  it('shows one group per destination with each amount summed into its own', () => {
    const { destinationRows, fee, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '10000000000000', '100')],
        outputs: [
          coinOutput('payee', '0', '0'),
          coinOutput('attacker', '1', '100000000000'),
          coinOutput('payee', '2', '200000000000'),
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      // the payee's pair is its own 0 + 2, never the other destination's
      // money and never hidden for being zero
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '2' }]),
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '1' }]),
    ])
    // the fee still counts every output: 100 − 0 − 1 − 2
    expect(fee).toEqual({ amount: '97' })
  })

  it('keeps a zero-amount output visible as its own destination pair', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '10000000000000', '100')],
        outputs: [coinOutput('payee', '0', '0')],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '0' }]),
    ])
  })

  it('attaches a lying decimal to the row of the destination it lies about', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '10000000000000', '100')],
        outputs: [
          coinOutput('payee', '1', '100000000000'),
          // LIE: the site reports 99 while committing 1 atom
          coinOutput('attacker', '99', '1'),
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
      pair('attacker', [
        {
          key: 'Coin',
          tokenId: null,
          errors: [
            {
              error: expect.stringMatching(/does not match/),
              amount: '0.00000000001',
            },
          ],
        },
      ]),
    ])
  })

  it('renders a destination pair with no amount row for an amountless output', () => {
    // a CreateDelegationId carries no signed amount: the destination is
    // still named, with nothing attributed to it
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        {
          inputs: [],
          outputs: [
            {
              type: 'CreateDelegationId',
              destination: 'attacker',
              pool_id: 'p1',
            },
          ],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([pair('attacker', [])])
    expect(extraAmountRows).toEqual([])
  })

  it('labels receiving-address destinations as this wallet’s, no other', () => {
    // a self-transfer: every output lands back on the wallet, the two
    // receiving destinations are its payments, the change address is not
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '10000000000000', '100')],
        outputs: [
          coinOutput('receiving', '2', '200000000000'),
          coinOutput('second-receiving', '3', '300000000000'),
          coinOutput('change', '95', '9500000000000'),
        ],
      },
      {
        tokenDecimalsById: new Map(),
        ownAddresses: {
          receiving: ['receiving', 'second-receiving'],
          change: ['change'],
        },
      },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('receiving', [{ key: 'Coin', tokenId: null, amount: '2' }], true),
      pair(
        'second-receiving',
        [{ key: 'Coin', tokenId: null, amount: '3' }],
        true,
      ),
    ])
  })

  // The signer ignores `destination`/`address` on Htlc, DelegateStaking and
  // BurnToken outputs, so a wallet address on one of them hides nothing:
  // its signed amount is summed into the amount rows (or surfaced as the
  // Burned row) exactly like any payment, and a lying decimal on it blocks.
  const decoyEscrowPayload = (escrowOutput) => ({
    inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
    outputs: [
      coinOutput('attacker', '10', '1000000000000'),
      { destination: 'wallet', address: 'wallet', ...escrowOutput },
    ],
  })

  it.each([
    [
      'Htlc',
      {
        type: 'Htlc',
        value: coin('16071.486043', '1607148604300000'),
        htlc: { spend_key: 'attacker', refund_key: 'attacker' },
      },
      // the keys the output commits are named beside its amount row, both
      // plainly not this wallet's
      [
        {
          key: 'htlc:1',
          spendKey: 'attacker',
          spendOwn: false,
          refundKey: 'attacker',
          refundOwn: false,
        },
      ],
    ],
    [
      'DelegateStaking',
      {
        type: 'DelegateStaking',
        amount: coin('16071.486043', '1607148604300000').amount,
        delegation_id: 'd1',
      },
      undefined,
    ],
  ])(
    'sums a %s output tagged with own addresses into a destination-less row',
    (_type, escrowOutput, htlcKeyRows) => {
      const { destinationRows, blocked } = reconcileApprovalAmounts(
        decoyEscrowPayload(escrowOutput),
        { tokenDecimalsById: new Map(), ownAddresses },
      )
      expect(blocked).toBe(false)
      // the payment pair, then the escrowed 16071.486043 beside no address
      // — never folded into the payment's amount
      expect(destinationRows).toEqual([
        pair('attacker', [{ key: 'Coin', tokenId: null, amount: '10' }]),
        {
          ...pair(null, [
            { key: 'Coin', tokenId: null, amount: '16071.486043' },
          ]),
          ...(htlcKeyRows
            ? {
                htlcKeyRows: htlcKeyRows.map((row) => ({
                  amount: '16071.486043',
                  tokenId: null,
                  ...row,
                })),
              }
            : {}),
        },
      ])
    },
  )

  it('blocks a lying decimal on a decoy-addressed Htlc output', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      decoyEscrowPayload({
        type: 'Htlc',
        // LIE: the escrow takes the whole remainder of the wallet
        value: coin('0.00000000001', '1607148604300000'),
        htlc: { spend_key: 'attacker', refund_key: 'attacker' },
      }),
      { tokenDecimalsById: new Map(), ownAddresses },
    )
    expect(blocked).toBe(true)
    // the lie shows on the destination-less row of the output that lies
    const unaddressed = destinationRows.find(
      (group) => group.destination === null,
    )
    expect(unaddressed.amountRows[0].errors).toEqual([
      {
        error: expect.stringMatching(/does not match/),
        amount: '16071.486043',
      },
    ])
    // blocked or not, the key rows stay on the summary: the user must see
    // whose keys the escrow commits — with the signed truth as the amount
    // it escrows
    expect(unaddressed.htlcKeyRows).toEqual([
      {
        key: 'htlc:1',
        spendKey: 'attacker',
        spendOwn: false,
        refundKey: 'attacker',
        refundOwn: false,
        amount: '16071.486043',
        tokenId: null,
      },
    ])
  })

  // Atoms the signer cannot encode (unparseable or negative) leave the
  // amount row with the failure reason alone: no signed amount exists to
  // name, so the key rows carry NO escrow amount — the fields are absent,
  // never a placeholder or the error text.
  it('carries no escrow amount on the key rows when the htlc atoms are unreadable', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [
          {
            type: 'Htlc',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '12x' },
            },
            htlc: { spend_key: 'attacker', refund_key: 'attacker' },
          },
          {
            type: 'Htlc',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '-5' },
            },
            htlc: { spend_key: 'wallet', refund_key: 'attacker' },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    // both failures surface on the destination-less amount row
    const unaddressed = destinationRows.find(
      (group) => group.destination === null,
    )
    expect(unaddressed.amountRows[0].errors).toHaveLength(2)
    // the key rows stay on the blocked summary, but name no amount: exact
    // shape (no extra properties at all) AND no amount/tokenId members,
    // not even undefined-valued ones
    expect(unaddressed.htlcKeyRows).toEqual([
      {
        key: 'htlc:0',
        spendKey: 'attacker',
        spendOwn: false,
        refundKey: 'attacker',
        refundOwn: false,
      },
      {
        key: 'htlc:1',
        spendKey: 'wallet',
        spendOwn: true,
        refundKey: 'attacker',
        refundOwn: false,
      },
    ])
    expect(
      unaddressed.htlcKeyRows.every(
        (row) =>
          !Object.prototype.hasOwnProperty.call(row, 'amount') &&
          !Object.prototype.hasOwnProperty.call(row, 'tokenId'),
      ),
    ).toBe(true)
  })

  // An Htlc output pays keys, not an address: the ownership of both keys it
  // commits travels beside its destination-less amount row, derived only
  // from the signer-encoded output.htlc.spend_key/refund_key, together with
  // the output's own signed amount — information only, never a block.
  it('carries the htlc key ownership beside its destination-less amount row', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [
          {
            type: 'Htlc',
            value: coin('10', '1000000000000'),
            htlc: { spend_key: 'wallet', refund_key: 'attacker' },
          },
          coinOutput('attacker', '5', '500000000000'),
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      {
        ...pair(null, [{ key: 'Coin', tokenId: null, amount: '10' }]),
        htlcKeyRows: [
          {
            key: 'htlc:0',
            spendKey: 'wallet',
            spendOwn: true,
            refundKey: 'attacker',
            refundOwn: false,
            amount: '10',
            tokenId: null,
          },
        ],
      },
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '5' }]),
    ])
  })

  it('lists every Htlc output on its own key rows, in declaration order', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [
          {
            type: 'Htlc',
            value: coin('1', '100000000000'),
            htlc: { spend_key: 'attacker', refund_key: 'change' },
          },
          {
            type: 'Htlc',
            value: coin('2', '200000000000'),
            htlc: { spend_key: 'wallet', refund_key: 'attacker' },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    // the amounts still sum into the one destination-less row, but each key
    // pair carries its own output's signed amount, so every pair stays tied
    // to the amount it escrows
    expect(destinationRows).toEqual([
      {
        ...pair(null, [{ key: 'Coin', tokenId: null, amount: '3' }]),
        htlcKeyRows: [
          {
            key: 'htlc:0',
            spendKey: 'attacker',
            spendOwn: false,
            refundKey: 'change',
            refundOwn: true,
            amount: '1',
            tokenId: null,
          },
          {
            key: 'htlc:1',
            spendKey: 'wallet',
            spendOwn: true,
            refundKey: 'attacker',
            refundOwn: false,
            amount: '2',
            tokenId: null,
          },
        ],
      },
    ])
  })

  it('attaches no htlc key rows without an Htlc output', () => {
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [coinOutput('attacker', '10', '1000000000000')],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '10' }]),
    ])
    expect(
      Object.prototype.hasOwnProperty.call(destinationRows[0], 'htlcKeyRows'),
    ).toBe(false)
  })

  it('surfaces a decoy-addressed BurnToken output as its signed Burned row', () => {
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        decoyEscrowPayload({
          type: 'BurnToken',
          value: coin('16071.486043', '1607148604300000'),
        }),
        { tokenDecimalsById: new Map(), ownAddresses },
      )
    // burns are never payment rows — the destroyed amount is its own row
    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '10' }]),
    ])
    expect(extraAmountRows).toEqual([
      {
        key: 'burned:1',
        label: 'Burned',
        tokenId: null,
        withTicker: true,
        amount: '16071.486043',
      },
    ])
  })

  it('blocks on a tampered declared fee when the sums are not computable', () => {
    const { fee, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: { command: 'CreateDelegationId' },
          },
        ],
        outputs: [],
        fee: { decimal: '0.00000000001', atoms: '100000' },
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(fee.error).toMatch(/fee does not match/)
  })

  it('blocks when a displayed amount carries an unknown token scale and a scaled label', () => {
    const tokenId = 'token-unknown'
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'Transfer',
            destination: 'attacker',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { decimal: '914', atoms: '91400' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(destinationRows[0].amountRows[0].errors[0].error).toMatch(
      /decimals are unknown/,
    )
    expect(destinationRows[0].amountRows[0].errors[0].amount).toBe('91400')
  })

  it('verifies CreateOrder balances and blocks a lying order decimal', () => {
    const tokenId = 'token-give'
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        {
          inputs: [coinInput('wallet', '10000000000000', '100')],
          outputs: [
            {
              type: 'CreateOrder',
              ask_balance: { atoms: '1000000000000', decimal: '10' },
              ask_currency: { type: 'Coin' },
              // LIE: 50000 atoms at scale 2 is 500, not 999
              give_balance: { atoms: '50000', decimal: '999' },
              give_currency: { type: 'Token', token_id: tokenId },
              conclude_destination: 'wallet',
            },
          ],
        },
        { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
      )

    expect(blocked).toBe(true)
    const give = extraAmountRows.find((row) => row.label === 'Order give')
    expect(give.errors[0].error).toMatch(/does not match/)
    expect(give.errors[0].amount).toBe('500')
    expect(give.withTicker).toBe(true)
    // an order output names no payment destination: no destination rows
    expect(destinationRows).toEqual([])
  })

  it('shows consistent order balances without blocking', () => {
    const tokenId = 'token-give'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'CreateOrder',
            ask_balance: { atoms: '1000000000000', decimal: '10' },
            ask_currency: { type: 'Coin' },
            give_balance: { atoms: '50000', decimal: '500' },
            give_currency: { type: 'Token', token_id: tokenId },
            initially_asked: { atoms: '1000000000000', decimal: '10' },
            initially_given: { atoms: '50000', decimal: '500' },
            conclude_destination: 'wallet',
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows.map((row) => [row.label, row.amount])).toEqual([
      ['Order ask', '10'],
      ['Order give', '500'],
    ])
    // initially_asked/given are chain-state metadata — the CreateOrder
    // encoding reads only ask_balance/give_balance, so they are not rows
  })

  it('resolves the DelegateStaking container per type, ignoring injected value', () => {
    // SECURITY: the signer escrows output.amount.atoms — a payload carrying
    // BOTH a pretty value (for display) and the huge signed amount must
    // review the amount-derived truth, never the attacker-chosen number.
    const { destinationRows, fee, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '9901000000000', '99.01')],
        outputs: [
          {
            type: 'DelegateStaking',
            value: {
              type: 'Coin',
              amount: { atoms: '1000', decimal: '0.00000000001' },
            },
            amount: { atoms: '9900000000000', decimal: '99' },
            delegation_id: 'd1',
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    // 99 ML escrow shown (the signed truth), not the 0.00000000001 decoy,
    // on the escrow's own destination-less row
    expect(destinationRows).toEqual([
      pair(null, [{ key: 'Coin', tokenId: null, amount: '99' }]),
    ])
    // fee = 99.01 − 99 escrow = 0.01
    expect(fee).toEqual({ amount: '0.01' })
  })

  it('does not render phantom rows for outputs without a known container', () => {
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        {
          inputs: [],
          outputs: [
            {
              type: 'DataDeposit',
              data: 'deadbeef',
              // injected top-level numerics the signer never reads
              atoms: '1000000000000',
              decimal: '10',
            },
          ],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('ignores injected top-level token_id for scale and identity', () => {
    const tokenId = 'token-inject'
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '10000000000000000', '100000')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'attacker',
            // top-level injection — the signer reads value.token_id only
            token_id: tokenId,
            value: {
              type: 'Coin',
              amount: { atoms: '10000000000000000', decimal: '100000' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    // coin truth at coin scale, keyed off the signer-read container only
    expect(destinationRows).toEqual([
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '100000' }]),
    ])
  })

  it('ignores injected command/account_type on value-bearing outputs', () => {
    // a Transfer output's identity and scale come from its value — the
    // signer never reads command/account_type/token_id on outputs
    const tokenId = 'token-real'
    const { destinationRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '100000000000000', '100000')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'attacker',
            command: 'MintTokens',
            token_id: 'token-cheap',
            account_type: 'DelegationBalance',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { atoms: '50000', decimal: '500' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    // the value's own identity and scale: 50000 atoms @2 = 500
    expect(destinationRows).toEqual([
      pair('attacker', [{ key: tokenId, tokenId, amount: '500' }]),
    ])
  })

  it('blocks a lying total_supply decimal on token issuance', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'IssueFungibleToken',
            number_of_decimals: 2,
            total_supply: {
              type: 'Fixed',
              amount: { atoms: '2500', decimal: '99' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows[0].label).toBe('Total supply')
    expect(extraAmountRows[0].errors[0].error).toMatch(/does not match/)
    expect(extraAmountRows[0].errors[0].amount).toBe('25')
    // pre-issuance: no ticker exists yet, the signed truth renders bare
    expect(extraAmountRows[0].withTicker).toBe(false)
  })

  it('shows a consistent total supply without blocking', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'IssueFungibleToken',
            number_of_decimals: 2,
            total_supply: {
              type: 'Fixed',
              amount: { atoms: '2500', decimal: '25' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([
      {
        key: 'supply:0',
        label: 'Total supply',
        tokenId: null,
        withTicker: false,
        amount: '25',
      },
    ])
  })

  it('never treats a BurnCoin-shaped output as a signed burn leg', () => {
    // the signer has no BurnCoin branch — such an output encodes to null and
    // must neither subtract from the fee nor render a Burned row
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'BurnCoin',
            value: {
              type: 'Coin',
              amount: { atoms: '10000000000000', decimal: '100' },
            },
          },
        ],
      ),
    ).toBe(10001000000000n) // fee = full input — nothing subtracted
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('a', '10001000000000', '100.01')],
        outputs: [
          {
            type: 'BurnCoin',
            value: {
              type: 'Coin',
              amount: { atoms: '10000000000000', decimal: '100' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )
    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([])
  })

  it('ignores malformed BurnToken values the signer drops', () => {
    // a BurnToken value with neither token_id nor type 'Coin' encodes to a
    // null output — it must not touch the fee or render a row
    expect(
      computeCoinFeeAtoms(
        [coinInput('a', '10001000000000', '100.01')],
        [
          {
            type: 'BurnToken',
            value: {
              type: 'Token',
              amount: { atoms: '10000000000000', decimal: '100' },
            },
          },
        ],
      ),
    ).toBe(10001000000000n)
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('a', '10001000000000', '100.01')],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'Token',
              amount: { atoms: '10000000000000', decimal: '100' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )
    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([])
  })

  it('credits DelegationBalance withdrawals on input_type Account too', () => {
    // the signer's inputCommands filter accepts both input_type spellings
    expect(
      computeCoinFeeAtoms(
        [
          {
            input_type: 'Account',
            input: {
              input_type: 'Account',
              account_type: 'DelegationBalance',
              delegation_id: 'd1',
              amount: { atoms: '1000000000000', decimal: '10' },
              nonce: '0',
            },
          },
          coinInput('a', '150000000000', '1.5'),
        ],
        [coinOutput('b', '8', '800000000000')],
      ),
    ).toBe(350000000000n) // 10 + 1.5 − 8 = 3.5 ML
  })

  it('does not fabricate a fill row for a contradictory FillOrder input', () => {
    // input_type 'UTXO' + command 'FillOrder' encodes a plain utxo input —
    // fill_atoms is never signed, so no row may be fabricated
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'UTXO',
            input: {
              input_type: 'UTXO',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: '1000000000000',
              destination: 'wallet',
              nonce: '0',
            },
            utxo: {
              destination: 'wallet',
              value: {
                type: 'Coin',
                amount: { atoms: '1000000000000', decimal: '10' },
              },
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([])
  })

  it('resolves no container for known-command DelegationBalance hybrids', () => {
    // the signer resolves known commands before the DelegationBalance branch:
    // UnmintTokens + DelegationBalance signs NO amount (the injected amount
    // is chain-state metadata, not a committed value)
    const source = {
      input_type: 'AccountCommand',
      command: 'UnmintTokens',
      account_type: 'DelegationBalance',
      amount: { atoms: '50000000000000', decimal: '500' },
      nonce: '0',
    }
    expect(signerAmountContainer({ input: source }, 'input')).toBe(null)

    // MintTokens keeps its signed amount container
    const mint = {
      input_type: 'AccountCommand',
      command: 'MintTokens',
      token_id: 't',
      amount: { atoms: '1500000000000000000', decimal: '1.5' },
      nonce: '0',
    }
    expect(signerAmountContainer({ input: mint }, 'input')).toBe(mint.amount)
  })

  it('does not fabricate rows for injected commands/account_type on outputs', () => {
    // LEG-KIND REGRESSION: the signer reads command/account_type on INPUTS
    // only — an output carrying those injected fields (plus a consistent
    // amount) encodes nothing signable, so no Amount row may appear
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        {
          inputs: [],
          outputs: [
            {
              type: 'CreateDelegationId',
              pool_id: 'p1',
              input_type: 'AccountCommand',
              command: 'MintTokens',
              token_id: 'tmltk1cheap',
              amount: { atoms: '2500', decimal: '25' },
            },
            {
              type: 'DataDeposit',
              data: 'aa',
              input_type: 'Account',
              account_type: 'DelegationBalance',
              amount: { atoms: '1000000000000', decimal: '10' },
            },
          ],
        },
        { tokenDecimalsById: new Map([['tmltk1cheap', 2]]), ownAddresses },
      )

    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('does not fake a value row for an account input injected with type Transfer', () => {
    // LEG-KIND REGRESSION: Transfer is an output type — the signer reads
    // input.value nowhere, so an account input injected with a type/value
    // pair resolves no container and shows no "will sign" number
    const { destinationRows, extraAmountRows, blocked } =
      reconcileApprovalAmounts(
        {
          inputs: [
            {
              input_type: 'AccountCommand',
              input: {
                input_type: 'AccountCommand',
                command: 'ConcludeOrder',
                order_id: 'o1',
                nonce: '0',
                type: 'Transfer',
                value: {
                  type: 'Coin',
                  amount: { atoms: '1000000000000', decimal: '10' },
                },
              },
            },
          ],
          outputs: [],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('blocks a lying decimal on a signed MintTokens amount', () => {
    // the signer commits input.amount.atoms for a mint, so its decimal label
    // is reconciliation-relevant exactly like a Transfer output's
    const tokenId = 'tmltk1mint2'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'MintTokens',
              token_id: tokenId,
              // LIE: 2500 atoms at scale 2 is 25, not 99
              amount: { atoms: '2500', decimal: '99' },
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'signed-amount:0',
        label: 'Amount',
        tokenId,
        withTicker: true,
        errors: [
          {
            error: expect.stringMatching(/does not match/),
            amount: '25',
          },
        ],
      },
    ])
  })

  it('blocks a lying decimal on a DelegationBalance withdrawal', () => {
    const { extraAmountRows, blocked, fee } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              account_type: 'DelegationBalance',
              delegation_id: 'd1',
              // LIE: 1000000000000 atoms is 10, not 1
              amount: { atoms: '1000000000000', decimal: '1' },
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'signed-amount:0',
        label: 'Amount',
        tokenId: null,
        withTicker: true,
        errors: [
          {
            error: expect.stringMatching(/does not match/),
            amount: '10',
          },
        ],
      },
    ])
    // the signed truth still drives the fee: the 10 ML credit is the only
    // coin leg
    expect(fee).toEqual({ amount: '10' })
  })

  it('keeps consistent mint/withdrawal amounts unblocked and row-free', () => {
    const tokenId = 'tmltk1mint2'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'MintTokens',
              token_id: tokenId,
              amount: { atoms: '2500', decimal: '25' },
              nonce: '0',
            },
          },
          {
            input_type: 'Account',
            input: {
              input_type: 'Account',
              account_type: 'DelegationBalance',
              delegation_id: 'd1',
              amount: { atoms: '1000000000000', decimal: '10' },
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    // honest amounts are already displayed by the operation panels — no new
    // row, and approval stays available
    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('collects supply extras even when the issuance targets a wallet address', () => {
    // relevance gates PAYMENT rows only — an extra routed to a wallet address
    // must still block on a lying decimal
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'IssueFungibleToken',
            destination: 'change',
            number_of_decimals: 2,
            total_supply: {
              type: 'Fixed',
              amount: { atoms: '2500', decimal: '999' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows[0].label).toBe('Total supply')
    expect(extraAmountRows[0].errors[0].error).toMatch(/does not match/)
    expect(extraAmountRows[0].errors[0].amount).toBe('25')
  })

  it('does not collect initially_* order balances as committed amounts', () => {
    // the CreateOrder encoding reads only ask_balance/give_balance —
    // initially_* are chain-state metadata the signer never encodes, so a
    // lying decimal on them can neither display nor block
    const tokenId = 'token-give'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'CreateOrder',
            ask_balance: { atoms: '1000000000000', decimal: '10' },
            ask_currency: { type: 'Coin' },
            give_balance: { atoms: '50000', decimal: '500' },
            give_currency: { type: 'Token', token_id: tokenId },
            initially_asked: { atoms: '1000000000000', decimal: '999' },
            initially_given: { atoms: '50000', decimal: '42' },
            conclude_destination: 'wallet',
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows.map((row) => row.label)).toEqual([
      'Order ask',
      'Order give',
    ])
  })

  it('shows and verifies the committed FillOrder fill_atoms size', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: '1000000000000',
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    // bare atom string, no scale in the payload → shown verbatim, with the
    // destination the signer encodes for the fill
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        amount: '1000000000000',
      },
    ])
  })

  it('renders the fill row without a destination when none is signer-readable', () => {
    for (const destination of [undefined, 42, { address: 'wallet' }]) {
      const { extraAmountRows, blocked } = reconcileApprovalAmounts(
        {
          inputs: [
            {
              input_type: 'AccountCommand',
              input: {
                input_type: 'AccountCommand',
                command: 'FillOrder',
                order_id: 'order-1',
                fill_atoms: '1000000000000',
                nonce: '0',
                ...(destination !== undefined ? { destination } : {}),
              },
            },
          ],
          outputs: [],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

      expect(blocked).toBe(false)
      // only a string destination the signer encodes is named
      expect(extraAmountRows).toEqual([
        {
          key: 'order:fill:0',
          label: 'Order fill',
          tokenId: null,
          withTicker: false,
          amount: '1000000000000',
        },
      ])
    }
  })

  it('blocks when the committed FillOrder size is unreadable or negative', () => {
    for (const bad of ['garbage', '-1000000000000']) {
      const { extraAmountRows, blocked } = reconcileApprovalAmounts(
        {
          inputs: [
            {
              input_type: 'AccountCommand',
              input: {
                input_type: 'AccountCommand',
                command: 'FillOrder',
                order_id: 'order-1',
                fill_atoms: bad,
                destination: 'wallet',
                nonce: '0',
              },
            },
          ],
          outputs: [],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

      expect(blocked).toBe(true)
      expect(extraAmountRows[0].errors).toHaveLength(1)
    }
  })

  // negative safe-integer amounts keep their own diagnostic: the number
  // path still reaches the amount verification, which refuses negatives
  it('blocks a negative safe-integer fill amount as negative', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: -5,
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        errors: [{ error: 'Amount cannot be negative', amount: null }],
      },
    ])
  })

  // The signer stringifies fill_atoms itself and the amount encoder accepts
  // decimal digits only, so only a digit string or an integer amount can
  // ever be part of a signed transaction: everything else is unmodelable
  // and must block with its own row instead of leaving the fill size
  // invisible or showing a size the signer would reject.
  it.each([
    ['an array', ['10000000000000']],
    ['an empty object', {}],
    ['a boolean', true],
    ['null', null],
    ['a plus-signed string', '+1000000000000'],
    ['a space-padded string', ' 1000000000000 '],
    ['a negative-signed string', '-0'],
    [
      'an atom count beyond the 128-bit amount width',
      '340282366920938463463374607431768211456',
    ],
    ['a 40-digit atom count', '9999999999999999999999999999999999999999'],
  ])('blocks an order fill amount that is %s', (_description, rawFill) => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: rawFill,
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        errors: [{ error: ORDER_FILL_UNREADABLE_MESSAGE, amount: null }],
      },
    ])
  })

  it('blocks a FillOrder input without any fill amount field', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        errors: [{ error: ORDER_FILL_UNREADABLE_MESSAGE, amount: null }],
      },
    ])
  })

  it('shows a safe-integer fill amount verbatim like a string one', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: 1000000000000,
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        amount: '1000000000000',
      },
    ])
  })

  it('shows width-boundary fill amounts verbatim like a smaller one', () => {
    // the amount encoder parses unsigned 128-bit: the full width, and the
    // whole range past the 64-bit lock counts, display and sign verbatim
    for (const rawFill of [
      '340282366920938463463374607431768211455',
      '18446744073709551616',
      '18446744073709551615',
      '9999999999999999999',
    ]) {
      const { extraAmountRows, blocked } = reconcileApprovalAmounts(
        {
          inputs: [
            {
              input_type: 'AccountCommand',
              input: {
                input_type: 'AccountCommand',
                command: 'FillOrder',
                order_id: 'order-1',
                fill_atoms: rawFill,
                destination: 'wallet',
                nonce: '0',
              },
            },
          ],
          outputs: [],
        },
        { tokenDecimalsById: new Map(), ownAddresses },
      )

      expect(blocked).toBe(false)
      expect(extraAmountRows).toEqual([
        {
          key: 'order:fill:0',
          label: 'Order fill',
          tokenId: null,
          withTicker: false,
          destination: 'wallet',
          amount: rawFill,
        },
      ])
    }
  })

  it('keeps the fill decimal-check error on an object-pair fill and blocks', () => {
    // a fill has no known scale (it lives in chain order data), so the
    // existing decimal-versus-atoms check fails closed on any attached
    // decimal label — that diagnostic stays on the row
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: { atoms: '10000000000000', decimal: '1' },
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows[0].errors).toContainEqual({
      error:
        'Token decimals are unknown to this wallet, so the site-reported amount cannot be verified',
      amount: '10000000000000',
    })
  })

  it('blocks an object-pair fill even when its decimal is consistent', () => {
    // the signer stringifies fill_atoms itself — an object cannot encode, so
    // no fill size may be displayed or approved from one
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: {
                atoms: '1000000000000',
                decimal: '1000000000000',
              },
              destination: 'wallet',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'order:fill:0',
        label: 'Order fill',
        tokenId: null,
        withTicker: false,
        destination: 'wallet',
        errors: [{ error: ORDER_FILL_UNREADABLE_MESSAGE, amount: null }],
      },
    ])
  })

  it('ignores non-FillOrder inputs when collecting signed extras', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              command: 'ConcludeOrder',
              order_id: 'order-1',
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('skips supply/order extras that carry no numeric amount', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'IssueFungibleToken',
            number_of_decimals: 8,
            total_supply: { type: 'Unlimited' },
          },
          {
            type: 'CreateOrder',
            ask_currency: { type: 'Coin' },
            give_currency: { type: 'Coin' },
            conclude_destination: 'wallet',
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  it('shows token burns as their own verified row and blocks a lying one', () => {
    const tokenId = 'token-burn'
    const lying = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              // LIE: 50000 atoms at scale 2 is 500, not 999
              amount: { atoms: '50000', decimal: '999' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(lying.blocked).toBe(true)
    expect(lying.extraAmountRows).toEqual([
      {
        key: 'burned:0',
        label: 'Burned',
        tokenId,
        withTicker: true,
        errors: [
          {
            error: expect.stringMatching(/does not match/),
            amount: '500',
          },
        ],
      },
    ])

    const honest = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { atoms: '50000', decimal: '500' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(honest.blocked).toBe(false)
    expect(honest.extraAmountRows).toEqual([
      {
        key: 'burned:0',
        label: 'Burned',
        tokenId,
        withTicker: true,
        amount: '500',
      },
    ])
  })

  it('fails closed on an unknown-scale token burn', () => {
    const tokenId = 'token-unknown-burn'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { atoms: '50000', decimal: '500' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(true)
    expect(extraAmountRows[0].errors[0].error).toMatch(/decimals are unknown/)
    expect(extraAmountRows[0].errors[0].amount).toBe('50000')
  })

  it('shows no supply row for a Lockable total_supply (no signed cap)', () => {
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'IssueFungibleToken',
            number_of_decimals: 2,
            // a Lockable supply encodes NO amount at signing time — a payload
            // attaching one must not display a cap
            total_supply: {
              type: 'Lockable',
              amount: { atoms: '2500', decimal: '99' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(extraAmountRows).toEqual([])
    expect(blocked).toBe(false)
  })

  // SECURITY: every leg entry is dApp-controlled. An entry the signer
  // cannot read — not an object, an input without its `input` object, an
  // output without a string `type` — is unverifiable: the payload is
  // blocked instead of the entry being skipped as if it carried no amount.
  it.each([
    ['a null output', { inputs: [], outputs: [null] }],
    ['an undefined output', { inputs: [], outputs: [undefined] }],
    [
      'a number output',
      { inputs: [coinInput('wallet', '100', '1')], outputs: [42] },
    ],
    ['a string output', { inputs: [], outputs: ['Transfer'] }],
    ['an array output', { inputs: [], outputs: [[]] }],
    [
      'an output without a type',
      { inputs: [], outputs: [{ destination: 'x', value: coin('1', '100') }] },
    ],
    [
      'an output whose type is not a string',
      { inputs: [], outputs: [{ type: 42 }] },
    ],
    ['a null input', { inputs: [null], outputs: [] }],
    ['a string input', { inputs: ['UTXO'], outputs: [] }],
    [
      'an input without an input object',
      {
        inputs: [{ utxo: { destination: 'wallet', value: coin('1', '100') } }],
        outputs: [],
      },
    ],
    [
      'an input whose input is not an object',
      { inputs: [{ input: 'UTXO' }], outputs: [] },
    ],
    // ... or nesting an object with its own `toString`/`valueOf`: it throws
    // wherever a string or a number is needed (label, object key, parseInt
    // argument), wherever it sits in the entry (an own `toLocaleString` or
    // Symbol.toPrimitive is flagged for completeness only)
    [
      'an output type that shadows toString',
      { inputs: [], outputs: [{ type: { toString: 1 } }] },
    ],
    [
      'an account command that shadows toString',
      {
        inputs: [
          { input: { input_type: 'AccountCommand', command: { toString: 1 } } },
        ],
        outputs: [],
      },
    ],
    [
      'a nested token id that shadows toString',
      {
        inputs: [coinInput('wallet', '100', '1')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'x',
            value: { token_id: { toString: 1 }, amount: { atoms: '100' } },
          },
        ],
      },
    ],
    [
      'a valueOf shadow nested inside an array',
      {
        inputs: [coinInput('wallet', '100', '1')],
        outputs: [{ type: 'DataDeposit', data: [['deep', { valueOf: 1 }]] }],
      },
    ],
    [
      'a toLocaleString shadow on a utxo leg',
      {
        inputs: [
          {
            input: { input_type: 'UTXO', source_id: 'src', index: 0 },
            utxo: {
              destination: 'wallet',
              value: { toLocaleString: 1, amount: { atoms: '1' } },
            },
          },
        ],
        outputs: [],
      },
    ],
    [
      'a Symbol.toPrimitive shadow',
      {
        inputs: [],
        outputs: [{ type: 'DataDeposit', data: { [Symbol.toPrimitive]: 1 } }],
      },
    ],
    [
      'an entry nested deeper than the walk limit',
      {
        inputs: [coinInput('wallet', '100', '1')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'x',
            value: nestedBelow({ atoms: '100' }, 20),
          },
        ],
      },
    ],
  ])('blocks on %s', (_description, legs) => {
    const { destinationRows, extraAmountRows, fee, blocked } =
      reconcileApprovalAmounts(legs, {
        tokenDecimalsById: new Map(),
        ownAddresses,
      })

    expect(blocked).toBe(true)
    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([])
    expect(fee).toBeNull()
  })

  it('does not block an empty outputs leg (a transaction with no outputs)', () => {
    const { blocked, fee } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '1707148604300000', '17071.486043')],
        outputs: [],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
    // no outputs: the whole input is the fee
    expect(fee).toEqual({ amount: '17071.486043' })
  })

  it('does not block plain nested objects that carry no shadowing member', () => {
    // a typed entry with an unreadable (but non-throwing) nested value stays
    // unblocked — it simply resolves no amount and fails closed at sign time
    const { blocked } = reconcileApprovalAmounts(
      {
        inputs: [coinInput('wallet', '100', '1')],
        outputs: [
          {
            type: 'Transfer',
            destination: 'x',
            value: nestedBelow({ foo: 'bar' }, 10),
          },
        ],
      },
      { tokenDecimalsById: new Map(), ownAddresses },
    )

    expect(blocked).toBe(false)
  })

  // The walk limit is pinned at its boundary. Levels are counted from the
  // leg entry (the entry itself is level 0, its `value` is level 1): an
  // entry whose objects reach exactly 16 levels is walked in full and is
  // not malformed; one reaching 17 levels is too deep to verify and is.
  const nestedTransfer = (levels) => ({
    inputs: [coinInput('wallet', '100', '1')],
    outputs: [
      {
        type: 'Transfer',
        destination: 'x',
        value: nestedBelow('leaf', levels),
      },
    ],
  })

  it('does not block an entry whose objects reach exactly 16 levels deep', () => {
    const { blocked } = reconcileApprovalAmounts(nestedTransfer(16), {
      tokenDecimalsById: new Map(),
      ownAddresses,
    })

    expect(blocked).toBe(false)
  })

  it('blocks an entry whose objects reach 17 levels deep', () => {
    const { blocked } = reconcileApprovalAmounts(nestedTransfer(17), {
      tokenDecimalsById: new Map(),
      ownAddresses,
    })

    expect(blocked).toBe(true)
  })

  // An intent that is present but not a string (opaque bytes) can neither be
  // shown nor acknowledged nor signed: it blocks exactly like a malformed
  // leg entry. No intent, or a string intent, leaves the verdict untouched.
  const consistentLegs = {
    inputs: [coinInput('wallet', '1000000000000', '10')],
    outputs: [coinOutput('x', '1', '100000000000')],
  }
  it.each([
    ['an object intent', {}],
    ['a shadowing intent', { toString: 1 }],
    ['a number intent', 42],
    ['an array intent', []],
  ])('blocks on %s', (_description, intent) => {
    expect(
      reconcileApprovalAmounts(consistentLegs, {
        tokenDecimalsById: new Map(),
        ownAddresses,
        intent,
      }).blocked,
    ).toBe(true)
  })

  it.each([
    ['no intent', undefined],
    ['a null intent', null],
    ['a string intent', 'deadbeef'],
  ])('keeps the verdict with %s', (_description, intent) => {
    expect(
      reconcileApprovalAmounts(consistentLegs, {
        tokenDecimalsById: new Map(),
        ownAddresses,
        intent,
      }).blocked,
    ).toBe(false)
  })
})

// A LockThenTransfer output addressed to one of the wallet's own addresses
// brings the funds back ENCUMBERED: the signer encodes the dApp-chosen lock
// next to the destination (getOutputs), so the funds are unspendable until
// that time or block. Such an output is neither a payment to others (it
// stays out of the Amount row) nor plain change: it gets its own row with
// its verified amount and its lock, and a lock the signer could not encode
// fails closed.
const LOCKED_ROW_LABEL = 'Locked at this wallet'
const LOCK_UNREADABLE =
  'The lock on these funds cannot be read, so this transaction cannot be signed'
const ownAddresses = { receiving: ['wallet'], change: ['change'] }
// The lock timestamp is rendered with the wallet's own date format.
const untilText = (timestamp) =>
  `until ${format(new Date(Number(timestamp) * 1000), 'dd/MM/yyyy HH:mm')}`
const lockedOutput = (
  destination,
  decimal,
  lock,
  atoms = toAtoms(decimal),
) => ({
  type: 'LockThenTransfer',
  destination,
  lock,
  value: coin(decimal, atoms),
})
const UNTIL_2100 = { type: 'UntilTime', content: { timestamp: 4102444800 } }
const FOR_7200_BLOCKS = { type: 'ForBlockCount', content: '7200' }

describe('readOutputLock / describeOutputLock', () => {
  it('reads an UntilTime lock from content.timestamp, as the signer does', () => {
    expect(readOutputLock(UNTIL_2100)).toEqual({
      type: 'UntilTime',
      timestamp: '4102444800',
    })
    expect(
      readOutputLock({ type: 'UntilTime', content: { timestamp: '1000' } }),
    ).toEqual({ type: 'UntilTime', timestamp: '1000' })
  })

  it('reads a ForBlockCount lock from content, as the signer does', () => {
    expect(readOutputLock(FOR_7200_BLOCKS)).toEqual({
      type: 'ForBlockCount',
      blockCount: '7200',
    })
    expect(readOutputLock({ type: 'ForBlockCount', content: 1 })).toEqual({
      type: 'ForBlockCount',
      blockCount: '1',
    })
  })

  it.each([
    ['a missing lock', undefined],
    ['a null lock', null],
    ['a non-object lock', '7200 blocks'],
    ['an array lock', ['ForBlockCount', '7200']],
    ['an unknown lock type', { type: 'ForSeconds', content: 30 }],
    ['a lock without a type', { content: 30 }],
    ['a non-string lock type', { type: 1, content: 30 }],
    ['a ForBlockCount lock without content', { type: 'ForBlockCount' }],
    ['a non-numeric block count', { type: 'ForBlockCount', content: 'soon' }],
    ['a negative block count', { type: 'ForBlockCount', content: -1 }],
    ['a fractional block count', { type: 'ForBlockCount', content: 1.5 }],
    [
      'a block count beyond safe precision',
      { type: 'ForBlockCount', content: 1e21 },
    ],
    [
      'a block count beyond the encoder’s 64-bit range',
      { type: 'ForBlockCount', content: '18446744073709551616' },
    ],
    [
      'a block count of a thousand digits',
      { type: 'ForBlockCount', content: '9'.repeat(1000) },
    ],
    [
      'a timestamp beyond the encoder’s 64-bit range',
      { type: 'UntilTime', content: { timestamp: '1' + '0'.repeat(30) } },
    ],
    ['a boolean block count', { type: 'ForBlockCount', content: true }],
    ['a hex block count', { type: 'ForBlockCount', content: '0x10' }],
    ['an UntilTime lock without content', { type: 'UntilTime' }],
    [
      'an UntilTime lock without a timestamp',
      { type: 'UntilTime', content: {} },
    ],
    [
      'an UntilTime lock with a non-numeric timestamp',
      {
        type: 'UntilTime',
        content: { timestamp: 'soon' },
      },
    ],
    [
      'an UntilTime lock with a negative timestamp',
      {
        type: 'UntilTime',
        content: { timestamp: -1 },
      },
    ],
    [
      'an UntilTime lock with a fractional timestamp',
      {
        type: 'UntilTime',
        content: { timestamp: 1.5 },
      },
    ],
    [
      'an UntilTime lock whose content is not an object',
      {
        type: 'UntilTime',
        content: 4102444800,
      },
    ],
  ])('fails closed on %s', (_description, lock) => {
    expect(readOutputLock(lock)).toEqual({ error: LOCK_UNREADABLE })
  })

  it('describes both lock kinds in plain words', () => {
    expect(describeOutputLock(UNTIL_2100)).toEqual({
      text: untilText('4102444800'),
    })
    expect(describeOutputLock(FOR_7200_BLOCKS)).toEqual({
      text: 'for 7200 blocks',
    })
    expect(describeOutputLock({ type: 'ForBlockCount', content: '1' })).toEqual(
      { text: 'for 1 block' },
    )
  })

  // 10^13 seconds fits the encoder (2^64 − 1 ≈ 1.8 × 10^19) but lies beyond
  // any date a Date can hold (≈ 8.6 × 10^12 seconds)
  const BEYOND_ANY_DATE = '10000000000000'

  it('shows a timestamp no date can represent as the raw signed number', () => {
    const farFuture = {
      type: 'UntilTime',
      content: { timestamp: BEYOND_ANY_DATE },
    }
    expect(describeOutputLock(farFuture).text).toBe(
      `until timestamp ${BEYOND_ANY_DATE}`,
    )
  })

  // The encoder's parameter is an unsigned 64-bit integer: the widest value
  // it takes is readable, anything wider is not — it would be truncated to
  // its low 64 bits there and never encoded as displayed.
  it('reads up to the encoder’s 64-bit limit and refuses anything wider', () => {
    const widest = '18446744073709551615'
    expect(readOutputLock({ type: 'ForBlockCount', content: widest })).toEqual({
      type: 'ForBlockCount',
      blockCount: widest,
    })
    expect(
      readOutputLock({
        type: 'UntilTime',
        content: { timestamp: `00${widest}` },
      }),
    ).toEqual({ type: 'UntilTime', timestamp: widest })
    expect(
      readOutputLock({
        type: 'ForBlockCount',
        content: '99999999999999999999',
      }),
    ).toEqual({
      error: LOCK_UNREADABLE,
    })
  })

  it('never throws on a lock that shadows primitive conversion', () => {
    expect(readOutputLock({ type: { toString: 1 }, content: 1 })).toEqual({
      error: LOCK_UNREADABLE,
    })
    expect(
      readOutputLock({
        type: 'UntilTime',
        content: { timestamp: { valueOf: 1 } },
      }),
    ).toEqual({ error: LOCK_UNREADABLE })
  })
})

describe('isLockedSelfOutput', () => {
  it('is true only for a LockThenTransfer whose signed destination is one of the wallet addresses', () => {
    expect(
      isLockedSelfOutput(
        lockedOutput('wallet', '1', FOR_7200_BLOCKS),
        ownAddresses,
      ),
    ).toBe(true)
    expect(
      isLockedSelfOutput(
        lockedOutput('change', '1', FOR_7200_BLOCKS),
        ownAddresses,
      ),
    ).toBe(true)
    // a plain Transfer to the wallet is change, not a locked output
    expect(isLockedSelfOutput(coinOutput('wallet', '1'), ownAddresses)).toBe(
      false,
    )
    // a locked output to someone else is a payment, with its own row
    expect(
      isLockedSelfOutput(
        lockedOutput('attacker', '1', FOR_7200_BLOCKS),
        ownAddresses,
      ),
    ).toBe(false)
    // `address` is read by the signer nowhere
    expect(
      isLockedSelfOutput(
        {
          ...lockedOutput('attacker', '1', FOR_7200_BLOCKS),
          address: 'wallet',
        },
        ownAddresses,
      ),
    ).toBe(false)
    expect(isLockedSelfOutput(null, ownAddresses)).toBe(false)
  })
})

describe('reconcileApprovalAmounts — locked outputs returning to the wallet', () => {
  // One destination group of the approval (same shape as the main
  // describe's helper).
  const pair = (destination, amountRows, toSelf = false) => ({
    destination,
    toSelf,
    amountRows,
  })
  // a wallet-owned utxo input of `decimal` coin (coinInput takes atoms first)
  const ownInput = (decimal) => coinInput('wallet', toAtoms(decimal), decimal)
  const reconcile = (payload) =>
    reconcileApprovalAmounts(payload, {
      tokenDecimalsById: new Map(),
      ownAddresses,
    })
  // A payment to the payee the user expects, next to the change coming
  // back locked until 2100 by the site's choice.
  const paymentAndLockedChange = {
    inputs: [ownInput('100')],
    outputs: [
      coinOutput('payee', '1'),
      lockedOutput('change', '99', UNTIL_2100),
    ],
  }

  it('shows the locked change on its own row, outside the Amount row, without blocking', () => {
    const { destinationRows, extraAmountRows, fee, blocked } = reconcile(
      paymentAndLockedChange,
    )

    // only the payment is an Amount
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
    ])
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:1',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        amount: '99',
        note: untilText('4102444800'),
      },
    ])
    // the fee stays inputs minus EVERY output, the locked one included
    expect(fee).toEqual({ amount: '0' })
    expect(blocked).toBe(false)
  })

  it('blocks a lying decimal on the locked amount and still shows its lock', () => {
    const { destinationRows, extraAmountRows, fee, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [
        coinOutput('payee', '1'),
        // LIE: 99 TML in atoms, labelled as 1
        lockedOutput('change', '1', UNTIL_2100, toAtoms('99')),
      ],
    })

    expect(blocked).toBe(true)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
    ])
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:1',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        errors: [
          {
            error: expect.stringMatching(/does not match/),
            amount: '99',
          },
        ],
        note: untilText('4102444800'),
      },
    ])
    expect(fee).toEqual({ amount: '0' })
  })

  it('shows amount and lock when the locked output is the only one', () => {
    const { destinationRows, extraAmountRows, fee, blocked } = reconcile({
      inputs: [ownInput('99')],
      outputs: [lockedOutput('change', '99', UNTIL_2100)],
    })

    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:0',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        amount: '99',
        note: untilText('4102444800'),
      },
    ])
    expect(fee).toEqual({ amount: '0' })
    expect(blocked).toBe(false)
  })

  // A delegation withdrawal as the SDK builds it: one DelegationBalance
  // input and one LockThenTransfer coin output back to the wallet, locked
  // for the staking maturity.
  it('shows the amount and the block lock of a delegation withdrawal', () => {
    const { destinationRows, extraAmountRows, fee, blocked } = reconcile({
      inputs: [
        {
          input: {
            input_type: 'Account',
            account_type: 'DelegationBalance',
            delegation_id: 'd1',
            amount: { atoms: '1000000000000', decimal: '10' },
            nonce: '1',
          },
        },
      ],
      outputs: [lockedOutput('wallet', '8', FOR_7200_BLOCKS)],
    })

    expect(destinationRows).toEqual([])
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:0',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        amount: '8',
        note: 'for 7200 blocks',
      },
    ])
    expect(fee).toEqual({ amount: '2' })
    expect(blocked).toBe(false)
  })

  it('lists every locked output on its own row, hiding nothing', () => {
    const { extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [
        coinOutput('payee', '1'),
        lockedOutput('change', '40', UNTIL_2100),
        lockedOutput('wallet', '59', FOR_7200_BLOCKS),
      ],
    })

    expect(blocked).toBe(false)
    expect(
      extraAmountRows.map((row) => [row.key, row.amount, row.note]),
    ).toEqual([
      ['locked:1', '40', untilText('4102444800')],
      ['locked:2', '59', 'for 7200 blocks'],
    ])
  })

  it('scales a locked token output by its chain decimals', () => {
    const tokenId = 'tmltk1locked'
    const { extraAmountRows, blocked } = reconcileApprovalAmounts(
      {
        inputs: [],
        outputs: [
          {
            type: 'LockThenTransfer',
            destination: 'wallet',
            lock: FOR_7200_BLOCKS,
            value: {
              type: 'TokenV1',
              token_id: tokenId,
              amount: { atoms: '2500', decimal: '25' },
            },
          },
        ],
      },
      { tokenDecimalsById: new Map([[tokenId, 2]]), ownAddresses },
    )

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:0',
        label: LOCKED_ROW_LABEL,
        tokenId,
        withTicker: true,
        amount: '25',
        note: 'for 7200 blocks',
      },
    ])
  })

  // The signer's getOutputs throws on a missing lock, an unknown lock type
  // or a content BigInt cannot encode: the request can never be signed, so
  // the approval fails closed and says why. The amount is still verified
  // where it is readable, so a lying decimal next to a bad lock reports both.
  it.each([
    ['a missing lock', undefined],
    ['an unknown lock type', { type: 'ForSeconds', content: 30 }],
    ['a non-numeric block count', { type: 'ForBlockCount', content: 'soon' }],
    ['a negative block count', { type: 'ForBlockCount', content: -1 }],
    [
      'a non-numeric UntilTime timestamp',
      {
        type: 'UntilTime',
        content: { timestamp: 'soon' },
      },
    ],
  ])('blocks on %s', (_description, lock) => {
    const { destinationRows, extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [coinOutput('payee', '1'), lockedOutput('change', '99', lock)],
    })

    expect(blocked).toBe(true)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
    ])
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:1',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        errors: [{ error: LOCK_UNREADABLE, amount: null }],
      },
    ])
  })

  it('reports both a lying decimal and an unreadable lock on the same output', () => {
    const { extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [
        coinOutput('payee', '1'),
        // LIE: 99 TML in atoms, labelled as 1 — and a lock no signer encodes
        lockedOutput('change', '1', { type: 'Nope' }, toAtoms('99')),
      ],
    })

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'locked:1',
        label: LOCKED_ROW_LABEL,
        tokenId: null,
        withTicker: true,
        // no lock words: none could be read
        errors: [
          { error: expect.stringMatching(/does not match/), amount: '99' },
          { error: LOCK_UNREADABLE, amount: null },
        ],
      },
    ])
  })

  it('blocks a locked output that carries no amount the signer could encode', () => {
    const { extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [
        { type: 'LockThenTransfer', destination: 'change', lock: UNTIL_2100 },
      ],
    })

    expect(blocked).toBe(true)
    expect(extraAmountRows[0].label).toBe(LOCKED_ROW_LABEL)
    expect(extraAmountRows[0].errors[0].error).toMatch(/cannot be verified/)
  })

  // A locked output paid to someone else is a payment, not this wallet's
  // encumbrance: its lock yields no row of its own. The signer still has to
  // encode that lock, though — one it could not encode can never be signed,
  // so the payment row fails closed with the reason (as the technical
  // preview already says on that row).
  it('keeps a foreign locked output with a readable lock as a plain payment', () => {
    const { destinationRows, extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [lockedOutput('attacker', '99', FOR_7200_BLOCKS)],
    })

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('attacker', [{ key: 'Coin', tokenId: null, amount: '99' }]),
    ])
    expect(extraAmountRows).toEqual([])
  })

  it.each([
    ['a missing lock', undefined],
    ['an unknown lock type', { type: 'Nope' }],
    ['a non-numeric block count', { type: 'ForBlockCount', content: 'soon' }],
  ])('blocks a foreign locked output with %s', (_description, lock) => {
    const { destinationRows, extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [coinOutput('payee', '1'), lockedOutput('attacker', '99', lock)],
    })

    expect(blocked).toBe(true)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
      pair('attacker', [
        {
          key: 'Coin',
          tokenId: null,
          errors: [{ error: LOCK_UNREADABLE, amount: null }],
        },
      ]),
    ])
    // it is a payment, not this wallet's encumbrance: no locked row
    expect(extraAmountRows).toEqual([])
  })

  it('reports a lying amount and an unreadable lock on the same foreign output', () => {
    const { destinationRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [lockedOutput('attacker', '1', { type: 'Nope' }, toAtoms('99'))],
    })

    expect(blocked).toBe(true)
    expect(destinationRows[0].amountRows[0].errors).toEqual([
      { error: LOCK_UNREADABLE, amount: null },
      { error: expect.stringMatching(/does not match/), amount: '99' },
    ])
  })

  it('blocks a foreign locked output without any amount when its lock is unreadable', () => {
    const { destinationRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [
        { type: 'LockThenTransfer', destination: 'attacker', lock: undefined },
      ],
    })

    expect(blocked).toBe(true)
    expect(destinationRows[0].amountRows[0].errors).toEqual([
      { error: LOCK_UNREADABLE, amount: null },
    ])
  })

  // A LockThenTransfer utxo is re-encoded by the signer with its own lock
  // (getTransactionHEX → getOutputs): one the signer could not encode can
  // never be signed either. That holds for a real utxo leg…
  const lockedUtxoInput = (lock, utxo = {}) => ({
    input: { input_type: 'UTXO', source_id: 'src', index: 0 },
    utxo: {
      type: 'LockThenTransfer',
      destination: 'wallet',
      lock,
      value: coin('40'),
      ...utxo,
    },
  })

  it('keeps a spent locked output with a readable lock unblocked and row-free', () => {
    const { extraAmountRows, fee, blocked } = reconcile({
      inputs: [lockedUtxoInput(FOR_7200_BLOCKS)],
      outputs: [coinOutput('payee', '40')],
    })

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([])
    expect(fee).toEqual({ amount: '0' })
  })

  it.each([
    ['a missing lock', undefined],
    ['an unknown lock type', { type: 'UntilHeight', content: 100 }],
    [
      'a non-numeric timestamp',
      { type: 'UntilTime', content: { timestamp: 'soon' } },
    ],
  ])('blocks a spent locked output with %s', (_description, lock) => {
    const { extraAmountRows, blocked } = reconcile({
      inputs: [lockedUtxoInput(lock)],
      outputs: [coinOutput('payee', '40')],
    })

    expect(blocked).toBe(true)
    expect(extraAmountRows).toEqual([
      {
        key: 'lock:input:0',
        label: 'Locked input',
        tokenId: null,
        withTicker: false,
        errors: [{ error: LOCK_UNREADABLE, amount: null }],
      },
    ])
  })

  // …and for an injected one alike: the signer's optUtxos_ map re-encodes
  // EVERY input carrying a LockThenTransfer utxo through getOutputs and
  // consults the input type only afterwards, to keep or discard the bytes.
  // So an injected utxo with an unreadable lock throws at sign time (after
  // the password) — it must block here as well — while a readable one
  // signs nothing and stays unblocked.
  const accountCommandWithInjectedUtxo = (lock) => ({
    input: {
      input_type: 'AccountCommand',
      command: 'UnmintTokens',
      nonce: '0',
    },
    utxo: lockedUtxoInput(lock).utxo,
  })

  it('keeps a readable injected lock on an account-command input unblocked', () => {
    const { extraAmountRows, blocked } = reconcile({
      inputs: [accountCommandWithInjectedUtxo(FOR_7200_BLOCKS)],
      outputs: [],
    })

    expect(blocked).toBe(false)
    expect(extraAmountRows).toEqual([])
  })

  it.each([
    ['a missing lock', undefined],
    ['an unknown lock type', { type: 'Nope' }],
    ['a non-numeric block count', { type: 'ForBlockCount', content: 'soon' }],
  ])(
    'blocks an injected locked utxo with %s on an account-command input',
    (_description, lock) => {
      const { extraAmountRows, blocked } = reconcile({
        inputs: [accountCommandWithInjectedUtxo(lock)],
        outputs: [],
      })

      expect(blocked).toBe(true)
      expect(extraAmountRows).toEqual([
        {
          key: 'lock:input:0',
          label: 'Locked input',
          tokenId: null,
          withTicker: false,
          errors: [{ error: LOCK_UNREADABLE, amount: null }],
        },
      ])
    },
  )

  // Unchanged: a plain Transfer to one of the wallet's own addresses is
  // change — no row at all.
  it('keeps a plain Transfer to the wallet as change, with no row', () => {
    const { destinationRows, extraAmountRows, blocked } = reconcile({
      inputs: [ownInput('100')],
      outputs: [coinOutput('payee', '1'), coinOutput('change', '99')],
    })

    expect(blocked).toBe(false)
    expect(destinationRows).toEqual([
      pair('payee', [{ key: 'Coin', tokenId: null, amount: '1' }]),
    ])
    expect(extraAmountRows).toEqual([])
  })
})

// The keys an Htlc OUTPUT commits, with their ownership of this wallet, for
// the approval summary: read only from the signer-encoded fields
// (output.htlc.spend_key / output.htlc.refund_key), strings only, receiving
// and change addresses alike.
describe('htlcOutputKeyOwnership', () => {
  const ownAddresses = { receiving: ['wallet'], change: ['change'] }

  it('reads only the signer-encoded htlc keys of an Htlc output', () => {
    expect(
      htlcOutputKeyOwnership(
        {
          type: 'Htlc',
          // decoys the signer ignores on an Htlc output
          destination: 'wallet',
          address: 'change',
          spend_address: 'wallet',
          refund_address: 'wallet',
          htlc: {
            spend_key: 'wallet',
            refund_key: 'attacker',
            refund_timelock: { type: 'ForBlockCount', content: 20 },
            secret_hash: { hex: 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3' },
          },
        },
        ownAddresses,
      ),
    ).toEqual({
      spendKey: 'wallet',
      spendOwn: true,
      refundKey: 'attacker',
      refundOwn: false,
    })
  })

  it('is null for any output type other than Htlc', () => {
    expect(
      htlcOutputKeyOwnership(
        { type: 'Transfer', destination: 'wallet', value: coin('1') },
        ownAddresses,
      ),
    ).toBe(null)
    expect(htlcOutputKeyOwnership(null, ownAddresses)).toBe(null)
    expect(htlcOutputKeyOwnership(undefined, ownAddresses)).toBe(null)
  })

  it('marks ownership only for string keys this wallet holds', () => {
    // a change address is this wallet's too; a non-string key is no key
    expect(
      htlcOutputKeyOwnership(
        { type: 'Htlc', htlc: { spend_key: 'change', refund_key: 'other' } },
        ownAddresses,
      ),
    ).toEqual({
      spendKey: 'change',
      spendOwn: true,
      refundKey: 'other',
      refundOwn: false,
    })
    expect(
      htlcOutputKeyOwnership(
        { type: 'Htlc', htlc: { spend_key: 42, refund_key: undefined } },
        ownAddresses,
      ),
    ).toEqual({
      spendKey: null,
      spendOwn: false,
      refundKey: null,
      refundOwn: false,
    })
  })

  it('tolerates a missing htlc object', () => {
    expect(htlcOutputKeyOwnership({ type: 'Htlc' }, ownAddresses)).toEqual({
      spendKey: null,
      spendOwn: false,
      refundKey: null,
      refundOwn: false,
    })
  })
})
