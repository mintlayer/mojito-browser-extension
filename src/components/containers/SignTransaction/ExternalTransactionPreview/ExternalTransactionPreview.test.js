import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { format } from 'date-fns'

import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import ExternalTransactionPreview from './ExternalTransactionPreview'

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    AccountContext: makeCtx({
      addresses: {
        mlAddresses: { mlReceivingAddresses: [], mlChangeAddresses: [] },
      },
    }),
    MintlayerContext: makeCtx({ tokenMap: {} }),
    SettingsContext: makeCtx({ networkType: 'testnet' }),
  }
})

const INPUT_ADDRESS = 'tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'
const OUTPUT_ADDRESS = 'tmt1q8hmm58xyscp0q8yh8r7q2zmkfc5cfmzeu5k0phq'

const coinValue = (atoms, decimal) => ({
  type: 'Coin',
  amount: { atoms, ...(decimal != null ? { decimal } : {}) },
})

const buildData = (
  outputValue,
  inputValue = coinValue('1707148604300000'),
) => ({
  request: {
    origin: 'https://attacker.example',
    requestId: 'regression-1',
    data: {
      txData: {
        JSONRepresentation: {
          inputs: [
            {
              input: {
                index: 0,
                input_type: 'UTXO',
                source_id:
                  '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                source_type: 'Transaction',
              },
              utxo: { destination: INPUT_ADDRESS, value: inputValue },
            },
          ],
          outputs: [
            {
              destination: OUTPUT_ADDRESS,
              type: 'Transfer',
              value: outputValue,
            },
          ],
        },
      },
    },
  },
})

const renderPreview = (data, mintlayerValue = { tokenMap: {} }) =>
  render(
    <AccountContext.Provider
      value={{
        addresses: {
          mlAddresses: { mlReceivingAddresses: [], mlChangeAddresses: [] },
        },
      }}
    >
      <MintlayerContext.Provider value={mintlayerValue}>
        <SettingsContext.Provider value={{ networkType: 'testnet' }}>
          <ExternalTransactionPreview data={data} />
        </SettingsContext.Provider>
      </MintlayerContext.Provider>
    </AccountContext.Provider>,
  )

describe('ExternalTransactionPreview amounts and fee', () => {
  // SECURITY REGRESSION:
  // the legacy preview rendered the dApp-supplied `.decimal` ("1") directly
  // while the signer commits `.atoms` (the whole balance).
  it('renders the transfer amount from the signed atoms and fails closed on a lying decimal', () => {
    renderPreview(buildData(coinValue('1000000000000', '1')))

    // the attacker-chosen number is never shown for the Amount
    expect(screen.getByText('Amount')).toBeInTheDocument()
    // BOTH the summary row and the breakdown row fail closed
    expect(
      screen.getAllByText(/does not match the amount that will be signed/)
        .length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/will sign 10/).length).toBeGreaterThan(0)
    // the fee is computed from the signed atom sums: 1707148604300000 −
    // 1000000000000 = 1706148604300000 atoms = 17061.486043 ML
    expect(screen.getByText('17061.486043')).toBeInTheDocument()
    // the declared fee (absent here) is not shown either
    expect(screen.queryByText('0.01')).not.toBeInTheDocument()
  })

  it('shows the atoms-derived amount and computed fee for a consistent payload', () => {
    renderPreview(buildData(coinValue('1000000000000', '10')))

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('17061.486043')).toBeInTheDocument()
  })

  it('derives the amount from atoms alone when the payload omits decimal labels', () => {
    renderPreview(buildData(coinValue('2500000000000')))

    // 2500000000000 atoms = 25 ML, derived from atoms alone
    expect(screen.getByText('25')).toBeInTheDocument()
    // fee: 1707148604300000 − 2500000000000 = 1704648604300000 atoms
    expect(screen.getByText('17046.486043')).toBeInTheDocument()
  })

  it('uses the declared fee only as a verified fallback when the sums are not computable', () => {
    const data = buildData(coinValue('1000000000000', '10'))
    data.request.data.txData.JSONRepresentation.inputs = []
    data.request.data.txData.JSONRepresentation.fee = {
      decimal: '0.01',
      atoms: '1000000000',
    }

    renderPreview(data)

    expect(screen.getByText('0.01')).toBeInTheDocument()
  })

  // SECURITY (an out-of-range number_of_decimals must fail closed,
  // never throw or hang): the token issuance preview verifies total supply
  // against the output's own signed number_of_decimals.
  const issueTokenData = (numberOfDecimals, supplyType = 'Fixed') => ({
    request: {
      origin: 'https://attacker.example',
      requestId: 'issue-1',
      data: {
        txData: {
          JSONRepresentation: {
            inputs: [],
            outputs: [
              {
                type: 'IssueFungibleToken',
                authority: 'tmt1qauthority',
                is_freezable: false,
                metadata_uri: { hex: '68747470', string: 'http' },
                number_of_decimals: numberOfDecimals,
                token_ticker: { hex: '4c4c4c', string: 'LLL' },
                total_supply: {
                  type: supplyType,
                  // a payload may attach an amount even to non-Fixed supply
                  // types; the signer encodes none, so it must not display
                  amount: { atoms: '100000000', decimal: '10000' },
                },
              },
            ],
          },
        },
      },
    },
  })

  it('shows an in-range total supply scaled by the signed number_of_decimals', () => {
    renderPreview(issueTokenData(2))

    // 100000000 atoms at 2 decimals = 10000
    const supplyHeading = screen.getByText('Total supply')
    expect(supplyHeading.nextElementSibling).toHaveTextContent('10000')
    expect(supplyHeading.nextElementSibling).not.toHaveTextContent(
      /scale cannot be verified/,
    )
  })

  it('fails closed when the signed number_of_decimals is negative', () => {
    renderPreview(issueTokenData(-1))

    const supplyHeading = screen.getByText('Total supply')
    expect(supplyHeading.nextElementSibling).toHaveTextContent(
      /scale cannot be verified/,
    )
    expect(supplyHeading.nextElementSibling).not.toHaveTextContent('10000')
  })

  it('fails closed when the signed number_of_decimals is unreadable', () => {
    renderPreview(issueTokenData('garbage'))

    const supplyHeading = screen.getByText('Total supply')
    expect(supplyHeading.nextElementSibling).toHaveTextContent(
      /scale cannot be verified/,
    )
    expect(supplyHeading.nextElementSibling).not.toHaveTextContent('10000')
  })

  // Preview CreateOrder rows (the verified-order paths need direct
  // coverage — consistent values render from atoms, lies fail closed).
  const createOrderData = (giveAtoms, giveDecimal) => ({
    request: {
      origin: 'https://attacker.example',
      requestId: 'order-preview-1',
      data: {
        txData: {
          JSONRepresentation: {
            inputs: [],
            outputs: [
              {
                type: 'CreateOrder',
                ask_balance: { atoms: '1000000000000', decimal: '10' },
                ask_currency: { type: 'Coin' },
                give_balance: { atoms: giveAtoms, decimal: giveDecimal },
                give_currency: { type: 'Token', token_id: 'tmltk1give' },
                initially_asked: { atoms: '1000000000000', decimal: '10' },
                initially_given: { atoms: giveAtoms, decimal: giveDecimal },
                conclude_destination: 'tmt1qconcludedestination',
              },
            ],
          },
        },
      },
    },
  })

  const orderMintlayerValue = {
    tokenMap: { tmltk1give: 'GIVE' },
    allNetworkTokensData: [{ token_id: 'tmltk1give', number_of_decimals: 2 }],
  }

  it('omits the Total supply row for a Lockable supply (no signed cap)', () => {
    renderPreview(issueTokenData(2, 'Lockable'))

    // the signer encodes a supply amount only for 'Fixed' — a payload that
    // attaches one to a non-Fixed type must not display a cap (the raw
    // payload dump in the breakdown still lists the fields verbatim)
    expect(screen.queryByText('Total supply')).not.toBeInTheDocument()
  })

  it('keys burn coin-vs-token off token-id presence, not the type label', () => {
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'burn-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [],
              outputs: [
                {
                  // a token burn whose value lacks a type label — still a
                  // token burn (the signer keys off token-id presence)
                  type: 'BurnToken',
                  value: {
                    token_id: 'tmltk1burn',
                    amount: { atoms: '50000', decimal: '500' },
                  },
                },
              ],
            },
          },
        },
      },
    })

    expect(screen.getByText('Token id')).toBeInTheDocument()
    expect(screen.getByText('tmltk1burn')).toBeInTheDocument()
    expect(screen.queryByText('Mintlayer Coin')).not.toBeInTheDocument()
  })

  it('renders the coin burn amount for a BurnToken output with a Coin value', () => {
    // coin burns encode as BurnToken with a Coin value (no token_id) — the
    // BurnCoin panel must find them and render the verified amount
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'coin-burn-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [
                {
                  input: { input_type: 'UTXO', source_id: 'src', index: 0 },
                  utxo: {
                    destination: 'tmt1qown',
                    value: {
                      type: 'Coin',
                      amount: { atoms: '10001000000000', decimal: '100.01' },
                    },
                  },
                },
              ],
              outputs: [
                {
                  type: 'BurnToken',
                  value: {
                    type: 'Coin',
                    amount: { atoms: '10000000000000', decimal: '100' },
                  },
                },
              ],
            },
          },
        },
      },
    })

    expect(screen.getByText('Burn coin')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('ignores injected account commands on UTXO inputs (no mint panel)', () => {
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'inject-mint-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [
                {
                  input: {
                    input_type: 'UTXO',
                    command: 'MintTokens',
                    token_id: 'cheap',
                    amount: { atoms: '1' },
                  },
                  utxo: {
                    destination: 'tmt1qown',
                    value: {
                      type: 'Coin',
                      amount: { atoms: '1000000000000', decimal: '10' },
                    },
                  },
                },
              ],
              outputs: [
                {
                  destination: 'tmt1qout',
                  value: {
                    type: 'Coin',
                    amount: { atoms: '1000000000000', decimal: '10' },
                  },
                },
              ],
            },
          },
        },
      },
    })

    // the transfer panel renders — never the injected mint panel
    expect(screen.queryByText('Mint tokens')).not.toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('normalizes non-array legs instead of crashing (fee renders Unknown)', () => {
    const data = buildData(coinValue('1000000000000', '10'))
    data.request.data.txData.JSONRepresentation.inputs = {}
    renderPreview(data)

    expect(screen.getByText('Amount')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    // the fee cannot be derived from a non-array input leg
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('does not fabricate an Amount for a utxo injected on an account input', () => {
    // LEG-KIND REGRESSION: the signer reads utxo legs only for input_type
    // 'UTXO' (non-UTXO legs force optUtxos to 0) — an account command with an
    // injected Htlc-shaped utxo (consistent atoms/decimal included) commits
    // nothing, so no Spend HTLC panel and no Amount may render
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'injected-htlc-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [
                {
                  input: {
                    input_type: 'AccountCommand',
                    command: 'ConcludeOrder',
                    order_id: 'order-1',
                    nonce: '0',
                  },
                  utxo: {
                    type: 'Htlc',
                    value: {
                      type: 'Coin',
                      amount: { atoms: '1000000000000', decimal: '10' },
                    },
                    htlc: {
                      secret_hash: { hex: 'aa' },
                      spend_key: 'tmt1qspend',
                      refund_key: 'tmt1qrefund',
                    },
                  },
                },
              ],
              outputs: [],
            },
          },
        },
      },
    })

    // the operation stays the account command — never flipped to a spend
    expect(screen.getByText('Conclude order')).toBeInTheDocument()
    expect(screen.queryByText('Spend HTLC')).not.toBeInTheDocument()
    // the injected consistent decimal renders nowhere
    expect(screen.queryByText('10')).not.toBeInTheDocument()
    // order legs are unmodelable for the fee — still rendered truthfully
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('still renders the Spend HTLC amount for a real UTXO HTLC input', () => {
    // positive control for the guard above: a genuine input_type 'UTXO' leg
    // spends its utxo.value, verified against the signed atoms
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'spend-htlc-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [
                {
                  input: {
                    index: 0,
                    input_type: 'UTXO',
                    source_id:
                      '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
                    source_type: 'Transaction',
                  },
                  utxo: {
                    type: 'Htlc',
                    destination: 'tmt1qown',
                    value: {
                      type: 'Coin',
                      amount: { atoms: '1000000000000', decimal: '10' },
                    },
                    htlc: {
                      secret_hash: { hex: 'aa' },
                      spend_key: 'tmt1qspend',
                      refund_key: 'tmt1qrefund',
                    },
                  },
                },
              ],
              outputs: [],
            },
          },
        },
      },
    })

    expect(screen.getByText('Spend HTLC')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
    // the Spend HTLC panel's own Amount renders the signed-atom truth (the
    // computed fee happens to be 10 as well — single input, no outputs)
    expect(screen.getByText('Amount').nextElementSibling).toHaveTextContent(
      '10',
    )
  })

  it('does not fabricate an Amount row for UnmintTokens (amount is not signed)', () => {
    renderPreview({
      request: {
        origin: 'https://attacker.example',
        requestId: 'unmint-1',
        data: {
          txData: {
            JSONRepresentation: {
              inputs: [
                {
                  input: {
                    input_type: 'AccountCommand',
                    command: 'UnmintTokens',
                    token_id: 'tmltk1unmint',
                    // not signed by UnmintTokens — must not render as a
                    // "will sign" number nor spuriously block
                    amount: { atoms: '5', decimal: '5' },
                    nonce: '0',
                  },
                },
              ],
              outputs: [],
            },
          },
        },
      },
    })

    expect(screen.getByText('Token id')).toBeInTheDocument()
    expect(screen.queryByText('Amount')).not.toBeInTheDocument()
  })

  it('renders consistent order balances from their signed atoms', () => {
    renderPreview(createOrderData('50000', '500'), orderMintlayerValue)

    expect(screen.getByText('Ask balance')).toBeInTheDocument()
    // 1000000000000 atoms = 10 (coin), 50000 atoms @ 2 decimals = 500
    expect(
      screen.getByText('Ask balance').nextElementSibling,
    ).toHaveTextContent('10')
    expect(
      screen.getByText('Give balance').nextElementSibling,
    ).toHaveTextContent('500')
    expect(
      screen.queryByText(/scale cannot be verified/),
    ).not.toBeInTheDocument()
  })

  it('fails closed when a lying order balance decimal does not reconcile', () => {
    renderPreview(createOrderData('50000', '999'), orderMintlayerValue)

    expect(screen.getByText('Give balance')).toBeInTheDocument()
    expect(
      screen.getAllByText(/does not match the amount that will be signed/)
        .length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/will sign 500/).length).toBeGreaterThan(0)
  })
})

// A LockThenTransfer output addressed to one of the wallet's own addresses
// brings the funds back encumbered by the site's chosen lock. The preview
// must agree with the approval summary: the same amount, the same lock
// words, and the balance change never reads as freely spendable money.
describe('ExternalTransactionPreview — locked outputs returning to this wallet', () => {
  const OWN_RECEIVING = 'tmt1qownreceiving'
  const OWN_CHANGE = 'tmt1qownchange'
  const LOCK_UNREADABLE =
    'The lock on these funds cannot be read, so this transaction cannot be signed'
  const UNTIL_2100 = { type: 'UntilTime', content: { timestamp: 4102444800 } }
  const FOR_7200_BLOCKS = { type: 'ForBlockCount', content: '7200' }
  const untilText = `until ${format(new Date(4102444800 * 1000), 'dd/MM/yyyy HH:mm')}`

  // Exact decimal string → atoms string at coin scale (11 decimals).
  const toAtoms = (decimal) => {
    const [whole, fraction = ''] = String(decimal).split('.')
    const digits = (fraction + '0'.repeat(11)).slice(0, 11)
    return `${whole}${digits}`.replace(/^0+(?=\d)/, '')
  }
  const ownInput = (decimal) => ({
    input: {
      index: 0,
      input_type: 'UTXO',
      source_id:
        '3e0c04ce80dff7dfae5be22b9ada59f0338d2a6ad6204aa1320a2fa5d6ca7afa',
      source_type: 'Transaction',
    },
    utxo: {
      type: 'Transfer',
      destination: OWN_RECEIVING,
      value: coinValue(toAtoms(decimal), decimal),
    },
  })
  const paymentTo = (destination, decimal) => ({
    destination,
    type: 'Transfer',
    value: coinValue(toAtoms(decimal), decimal),
  })
  const lockedOutput = (destination, decimal, lock) => ({
    destination,
    type: 'LockThenTransfer',
    lock,
    value: coinValue(toAtoms(decimal), decimal),
  })
  const dataOf = (outputs, inputs) => ({
    request: {
      origin: 'https://app.example',
      requestId: 'locked-1',
      data: { txData: { JSONRepresentation: { inputs, outputs } } },
    },
  })
  const renderAsOwn = (data) =>
    render(
      <AccountContext.Provider
        value={{
          addresses: {
            mlAddresses: {
              mlReceivingAddresses: [OWN_RECEIVING],
              mlChangeAddresses: [OWN_CHANGE],
            },
          },
        }}
      >
        <MintlayerContext.Provider value={{ tokenMap: {} }}>
          <SettingsContext.Provider value={{ networkType: 'testnet' }}>
            <ExternalTransactionPreview data={data} />
          </SettingsContext.Provider>
        </MintlayerContext.Provider>
      </AccountContext.Provider>,
    )
  const lockedReturns = () => screen.queryAllByTestId('locked-return')
  // the cell that follows a heading
  const after = (heading) => screen.getByText(heading).nextElementSibling

  it('names the lock of the locked change beside the payment, with the amounts the summary shows', () => {
    renderAsOwn(
      dataOf(
        [
          paymentTo(OUTPUT_ADDRESS, '1'),
          lockedOutput(OWN_CHANGE, '99', UNTIL_2100),
        ],
        [ownInput('100')],
      ),
    )

    // the panel describes the payment as before
    expect(screen.getByText('Transfer coins')).toBeInTheDocument()
    expect(after('Destination')).toHaveTextContent(OUTPUT_ADDRESS)
    expect(after('Amount')).toHaveTextContent('1')
    // the balance change is the fee alone: 100 in − 99 back …
    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      '\u22121 TML',
    )
    // … and the 99 coming back are named as locked, with the summary's words
    expect(lockedReturns()).toHaveLength(1)
    expect(lockedReturns()[0]).toHaveTextContent(
      `99 TML come back to this wallet locked (${untilText}) — not spendable until then.`,
    )
    const row = screen.getByText('lock').closest('li')
    expect(within(row).getByText('lock').nextElementSibling).toHaveTextContent(
      untilText,
    )
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument()
  })

  it('shows amount and lock of a locked output that is the only one, to a receiving address', () => {
    renderAsOwn(
      dataOf(
        [lockedOutput(OWN_RECEIVING, '99', UNTIL_2100)],
        [ownInput('100')],
      ),
    )

    // the transfer panel names the output with its lock, not a bare self-send
    expect(after('Destination')).toHaveTextContent(
      `${OWN_RECEIVING} (your address)`,
    )
    expect(after('Amount')).toHaveTextContent('99')
    expect(screen.getByText('Lock')).toBeInTheDocument()
    expect(after('Lock')).toHaveTextContent(untilText)
    expect(lockedReturns()[0]).toHaveTextContent(
      `99 TML come back to this wallet locked (${untilText})`,
    )
  })

  it('still names the lock in the breakdown when the locked output goes to a change address', () => {
    renderAsOwn(
      dataOf([lockedOutput(OWN_CHANGE, '99', UNTIL_2100)], [ownInput('100')]),
    )

    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      '\u22121 TML',
    )
    expect(lockedReturns()[0]).toHaveTextContent(
      `99 TML come back to this wallet locked (${untilText})`,
    )
    const row = screen.getByText('lock').closest('li')
    expect(within(row).getByText('lock').nextElementSibling).toHaveTextContent(
      untilText,
    )
  })

  // A delegation withdrawal as the SDK builds it: one DelegationBalance
  // input and one LockThenTransfer coin output back to the wallet, locked
  // for the staking maturity.
  it('shows the block lock of a delegation withdrawal with the amount coming back', () => {
    renderAsOwn(
      dataOf(
        [lockedOutput(OWN_RECEIVING, '8', FOR_7200_BLOCKS)],
        [
          {
            input: {
              input_type: 'Account',
              account_type: 'DelegationBalance',
              delegation_id:
                'tdelg1mfust4vvrn3xy6slm9qvtf8kjlzw4ezspkqwenfnzryyeumgdahqp2upjz',
              amount: { decimal: '10', atoms: toAtoms('10') },
              nonce: 1,
            },
          },
        ],
      ),
    )

    expect(screen.getByText('Withdraw from delegation')).toBeInTheDocument()
    expect(screen.getByText('Amount').nextElementSibling).toHaveTextContent(
      '10',
    )
    expect(screen.getByTestId('balance-change')).toHaveTextContent('+8 TML')
    expect(lockedReturns()[0]).toHaveTextContent(
      '8 TML come back to this wallet locked (for 7200 blocks) — not spendable until then.',
    )
    const row = screen.getByText('lock').closest('li')
    expect(within(row).getByText('lock').nextElementSibling).toHaveTextContent(
      'for 7200 blocks',
    )
  })

  it('names a lock that cannot be read instead of showing a number or a date', () => {
    renderAsOwn(
      dataOf(
        [
          lockedOutput(OWN_RECEIVING, '99', {
            type: 'ForBlockCount',
            content: 'soon',
          }),
        ],
        [ownInput('100')],
      ),
    )

    expect(screen.getByText('Lock')).toBeInTheDocument()
    expect(after('Lock')).toHaveTextContent(LOCK_UNREADABLE)
    expect(lockedReturns()[0]).toHaveTextContent(
      'Funds come back to this wallet with a lock that cannot be read — this transaction cannot be signed.',
    )
  })
})
