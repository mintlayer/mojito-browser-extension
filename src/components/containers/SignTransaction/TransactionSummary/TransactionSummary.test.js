import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

import { MintlayerContext } from '@Contexts'
import TransactionSummary from './TransactionSummary'

jest.mock('@Contexts', () => {
  const React = require('react')
  const makeCtx = (value) => React.createContext(value)
  return {
    __esModule: true,
    MintlayerContext: makeCtx({ tokenMap: {} }),
    SettingsContext: makeCtx({ networkType: 'mainnet' }),
  }
})

const OWN_RECEIVING = 'mtc1q0123456789abcdefownrec9876543210'
const OWN_CHANGE = 'mtc1q0123456789abcdefownchg9876543210'
const DESTINATION = 'mtc1qdestination9876543210abcdefwxyz'
const TOKEN_ID =
  '0xdeadbeefcafe00000000000000000000000000000000000000000000000001'

const OWN_ADDRESSES = {
  receiving: [OWN_RECEIVING],
  change: [OWN_CHANGE],
}

// The component truncates as `head(10)…tail(8)` for long values.
const truncated = (address) => `${address.slice(0, 10)}…${address.slice(-8)}`

// Exact decimal-string → atoms BigInt string (no float math), mirroring the
// scaling the dApp SDK applies when it builds `amount.atoms`.
const toAtoms = (decimal, decimals = 11) => {
  const [whole, fraction = ''] = String(decimal).split('.')
  const digits = (fraction + '0'.repeat(decimals)).slice(0, decimals)
  const atoms = `${whole}${digits}`.replace(/^(-?)0+(?=\d)/, '$1')
  return atoms === '' ? '0' : atoms
}

// A well-formed coin value: the `.decimal` label matches the signed `.atoms`.
const coin = (decimal, atoms = toAtoms(decimal)) => ({
  type: 'Coin',
  amount: { decimal, atoms },
})

const token = (tokenId, decimal, atoms, decimals = 11) => ({
  type: 'TokenV1',
  token_id: tokenId,
  amount: { decimal, atoms: atoms ?? toAtoms(decimal, decimals) },
})

const transferJsonRepresentation = {
  inputs: [
    {
      input: { input_type: 'UTXO' },
      input_type: 'UTXO',
      utxo: { destination: OWN_RECEIVING, value: coin('100') },
    },
  ],
  outputs: [{ type: 'Transfer', destination: DESTINATION, value: coin('25') }],
  fee: { decimal: '0.01', atoms: toAtoms('0.01') },
}

const renderSummary = ({
  jsonRepresentation = transferJsonRepresentation,
  intent,
  ownAddresses = OWN_ADDRESSES,
  technicalDetails = <div>technical payload</div>,
  rawJsonNode = <div>{'{"raw":true}'}</div>,
  mintlayerValue,
} = {}) =>
  render(
    <MintlayerContext.Provider value={mintlayerValue ?? { tokenMap: {} }}>
      <TransactionSummary
        jsonRepresentation={jsonRepresentation}
        intent={intent}
        ownAddresses={ownAddresses}
        technicalDetails={technicalDetails}
        rawJsonNode={rawJsonNode}
      />
    </MintlayerContext.Provider>,
  )

describe('TransactionSummary', () => {
  it('renders a Send summary for a plain transfer', () => {
    renderSummary()

    expect(screen.getByTestId('transaction-summary')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()

    expect(screen.getByText(truncated(OWN_RECEIVING))).toBeInTheDocument()
    expect(screen.getByText(truncated(DESTINATION))).toBeInTheDocument()
    expect(screen.getByText('25 ML')).toBeInTheDocument()
    // SECURITY: the fee is COMPUTED from the signed atom sums (100 in − 25 out),
    // never taken from the dApp-supplied `fee` field (which claims 0.01).
    expect(screen.getByText('75 ML')).toBeInTheDocument()
    expect(screen.getByText('Mainnet')).toBeInTheDocument()

    // one copy button next to From, one next to To
    expect(screen.getAllByTestId('copy-btn')).toHaveLength(2)
  })

  it('hides the technical details until the toggle is clicked', () => {
    renderSummary()

    expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument()
    expect(screen.queryByText('technical payload')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('toggle-technical-details'))

    const details = screen.getByTestId('technical-details')
    expect(details).toBeInTheDocument()
    expect(details).toHaveTextContent('technical payload')
    expect(details).toHaveTextContent('{"raw":true}')

    // toggling again hides them
    fireEvent.click(screen.getByTestId('toggle-technical-details'))
    expect(screen.queryByTestId('technical-details')).not.toBeInTheDocument()
  })

  it('renders the fee as Unknown when the coin sums are unreadable', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: {
                type: 'Coin',
                amount: { decimal: 'not-a-number', atoms: 'garbage' },
              },
            },
          },
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('25') },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    // an unreadable coin leg makes the fee unverifiable — never guess from
    // the attacker-controlled declared fee
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('subtracts staking escrow from the fee', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100.01') },
          },
        ],
        outputs: [
          {
            type: 'DelegateStaking',
            amount: { decimal: '100', atoms: toAtoms('100') },
            delegation_id: 'd1',
          },
        ],
      },
    })

    // 100.01 in − 100 escrowed = 0.01 miner fee (was 100.01 before the fix)
    expect(screen.getByText('100 ML')).toBeInTheDocument()
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
  })

  it('credits a delegation withdrawal as coin input', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              account_type: 'DelegationBalance',
              delegation_id: 'd1',
              amount: { decimal: '10', atoms: toAtoms('10') },
              nonce: '0',
            },
          },
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('1.5') },
          },
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('8') },
          { type: 'Transfer', destination: OWN_CHANGE, value: coin('3.25') },
        ],
      },
    })

    // withdrawal 10 + utxo 1.5 − 8 − 3.25 = 0.25 miner fee
    expect(screen.getByText('0.25 ML')).toBeInTheDocument()
  })

  it('shows burned coins as a destroyed amount, never as the miner fee', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100.01') },
          },
        ],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'Coin',
              amount: { decimal: '100', atoms: toAtoms('100') },
            },
          },
        ],
      },
    })

    expect(screen.getByText('Burned')).toBeInTheDocument()
    expect(screen.getByText('100 ML')).toBeInTheDocument()
    // 100.01 in − 100 burned = 0.01 miner fee
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
  })

  it('shows burned tokens as a destroyed amount and blocks a lying burn', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [],
        outputs: [
          {
            type: 'BurnToken',
            value: {
              type: 'TokenV1',
              token_id: TOKEN_ID,
              // LIE: 50000 atoms at scale 2 is 500, not 999
              amount: { decimal: '999', atoms: '50000' },
            },
          },
        ],
      },
      mintlayerValue: {
        tokenMap: { [TOKEN_ID]: 'MLUSDC' },
        allNetworkTokensData: [{ token_id: TOKEN_ID, number_of_decimals: 2 }],
      },
    })

    expect(screen.getByText('Burned')).toBeInTheDocument()
    expect(screen.getByText(/will sign 500 MLUSDC/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    // burns are never payment rows
    expect(screen.queryByText('Amount')).not.toBeInTheDocument()
  })

  it('renders the fee as Unknown for an order fill payload and shows the fill size', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: '1000000000000',
              destination: DESTINATION,
              nonce: '0',
            },
          },
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('1.5') },
          },
        ],
        outputs: [],
      },
    })

    // the fill leg's currency is not in the payload — fee is unknowable
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('Order fill')).toBeInTheDocument()
    expect(screen.getByText('1000000000000')).toBeInTheDocument()
  })

  it('blocks approval when the payload legs are not arrays', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: {},
        outputs: [],
      },
    })

    // fail closed: unverifiable payload, no crash
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
    expect(screen.getByText('Transaction')).toBeInTheDocument()
  })

  // SECURITY REGRESSION:
  // a dApp that reports "1 ML" in `.decimal` while committing the whole
  // balance in `.atoms` must fail closed — no number, an error and a
  // blocked-approval banner instead.
  it('blocks approval when the site-reported decimal disagrees with the signed atoms', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: coin('17071.486043'),
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '1707148604300000' },
            },
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    // the attacker-chosen number is never shown
    expect(screen.queryByText('1 ML')).not.toBeInTheDocument()
    // the row shows the fail-closed error plus the amount that WILL be signed
    expect(
      screen.getByText(/does not match the amount that will be signed/),
    ).toBeInTheDocument()
    expect(screen.getByText(/will sign 17071\.486043 ML/)).toBeInTheDocument()
    // and the approval is explicitly blocked
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('renders amounts from the signed atoms even when the decimal label is absent', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: { type: 'Coin', amount: { atoms: '10000000000000' } },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: { type: 'Coin', amount: { atoms: '2500000000000' } },
          },
        ],
        fee: { atoms: toAtoms('0.01') },
      },
    })

    // 2500000000000 atoms = 25 ML, derived from atoms alone
    expect(screen.getByText('25 ML')).toBeInTheDocument()
    // fee computed from the atom sums: 100 − 25 = 75
    expect(screen.getByText('75 ML')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('computes the network fee from the signed atom sums (inputs − outputs)', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: { type: 'Coin', amount: { atoms: '1707148604300000' } },
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: { type: 'Coin', amount: { atoms: '1706948604300000' } },
          },
        ],
        // a lying declared fee must be ignored while the sums are computable
        fee: { decimal: '0.000000001', atoms: '1' },
      },
    })

    // 1707148604300000 − 1706948604300000 = 200000000000 atoms = 2 ML
    expect(screen.getByText('2 ML')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('fails closed when the declared fee decimals disagree with the fee atoms', () => {
    renderSummary({
      jsonRepresentation: {
        // account-command style: no coin values, so the sums are not computable
        inputs: [
          {
            input_type: 'AccountCommand',
            input: { command: 'MintTokens', token_id: TOKEN_ID },
          },
        ],
        outputs: [],
        fee: { decimal: '0.00000000001', atoms: '100000' },
      },
    })

    expect(screen.getByText(/fee does not match/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('shows a separate Amount row per asset for mixed coin+token payments', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: token(TOKEN_ID, '25', '2500', 2),
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: token(TOKEN_ID, '25', '2500', 2),
          },
          // a second asset paying out alongside the token…
          { type: 'Transfer', destination: DESTINATION, value: coin('10') },
          // …while the coin change returns to the wallet (never a payment)
          {
            type: 'Transfer',
            destination: OWN_CHANGE,
            value: coin('89.99'),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
      mintlayerValue: {
        tokenMap: { [TOKEN_ID]: 'MLUSDC' },
        allNetworkTokensData: [{ token_id: TOKEN_ID, number_of_decimals: 2 }],
      },
    })

    expect(screen.getByText('25 MLUSDC')).toBeInTheDocument()
    expect(screen.getByText('10 ML')).toBeInTheDocument()
    // the change is not counted as a payment
    expect(screen.queryByText('89.99 ML')).not.toBeInTheDocument()
    // fee from coin atom sums: 100 − 10 − 89.99 = 0.01
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('aggregates every mismatching output of an asset, not only the first', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('80') },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '1000000000000' },
            },
          },
          {
            type: 'Transfer',
            destination: 'mtc1qsecondrecipient0abcdefgh',
            value: {
              type: 'Coin',
              amount: { decimal: '1', atoms: '2000000000000' },
            },
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.queryByTestId('approval-blocked')).toBeInTheDocument()
    // both offenders' signed truths are surfaced in the single asset row
    expect(screen.getByText(/will sign 10 ML/)).toBeInTheDocument()
    expect(screen.getByText(/will sign 20 ML/)).toBeInTheDocument()
  })

  it('fails closed on negative atom amounts', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: {
              type: 'Coin',
              amount: { decimal: '-1', atoms: '-100000000000' },
            },
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText(/cannot be negative/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('labels every supported operation, including data deposits and orders', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [{ type: 'DataDeposit', data: 'hello' }],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('Data deposit')).toBeInTheDocument()
  })

  it('blocks approval when a CreateOrder balance lies about its amount', () => {
    const tokenId = TOKEN_ID
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [
          {
            type: 'CreateOrder',
            ask_balance: { atoms: '1000000000000', decimal: '10' },
            ask_currency: { type: 'Coin' },
            // LIE: 50000 atoms at scale 2 is 500, not 999
            give_balance: { atoms: '50000', decimal: '999' },
            give_currency: { type: 'Token', token_id: tokenId },
            conclude_destination: DESTINATION,
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
      mintlayerValue: {
        tokenMap: { [tokenId]: 'MLUSDC' },
        allNetworkTokensData: [{ token_id: tokenId, number_of_decimals: 2 }],
      },
    })

    expect(screen.getByText('Order give')).toBeInTheDocument()
    expect(
      screen.getByText(/does not match the amount that will be signed/),
    ).toBeInTheDocument()
    expect(screen.getByText(/will sign 500 MLUSDC/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('blocks approval when an issued total supply lies about its amount', () => {
    renderSummary({
      jsonRepresentation: {
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
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('Total supply')).toBeInTheDocument()
    expect(
      screen.getByText(/does not match the amount that will be signed/),
    ).toBeInTheDocument()
    expect(screen.getByText(/will sign 25/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('renders a computed zero fee as 0 instead of the site-declared fee', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('60') },
          // change consumes the rest exactly: computed fee is 0
          { type: 'Transfer', destination: OWN_CHANGE, value: coin('40') },
        ],
        // self-consistent site fee must NOT replace the computed zero
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('60 ML')).toBeInTheDocument()
    expect(screen.getByText('0 ML')).toBeInTheDocument()
    expect(screen.queryByText('0.01 ML')).not.toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('shows the committed FillOrder fill size from the account command input', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: '1000000000000',
              destination: DESTINATION,
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
    })

    expect(screen.getByText('Order fill')).toBeInTheDocument()
    // bare atom string, no scale in the payload → shown verbatim
    expect(screen.getByText('1000000000000')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('blocks approval when the committed FillOrder size is unreadable', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input_type: 'AccountCommand',
            input: {
              input_type: 'AccountCommand',
              command: 'FillOrder',
              order_id: 'order-1',
              fill_atoms: 'garbage',
              destination: DESTINATION,
              nonce: '0',
            },
          },
        ],
        outputs: [],
      },
    })

    expect(screen.getByText(/cannot be verified/)).toBeInTheDocument()
    expect(screen.getByTestId('approval-blocked')).toBeInTheDocument()
  })

  it('resolves the DelegateStaking container per type, ignoring injected value', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('99.01') },
          },
        ],
        outputs: [
          {
            type: 'DelegateStaking',
            // attacker-chosen display value…
            value: {
              type: 'Coin',
              amount: { decimal: '0.00000000001', atoms: '1000' },
            },
            // …vs the 99 ML the signer actually escrows
            amount: { decimal: '99', atoms: toAtoms('99') },
            delegation_id: 'd1',
          },
        ],
      },
    })

    // the amount-derived truth is reviewed, not the injected decoy
    expect(screen.getByText('99 ML')).toBeInTheDocument()
    expect(screen.queryByText('0.00000000001 ML')).not.toBeInTheDocument()
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
  })

  it('ignores injected top-level token_id when displaying a coin transfer', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100000') },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            // top-level injection — the signer reads value.token_id only
            token_id: TOKEN_ID,
            value: {
              type: 'Coin',
              amount: { decimal: '100000', atoms: toAtoms('100000') },
            },
          },
        ],
      },
      mintlayerValue: {
        tokenMap: { [TOKEN_ID]: 'MLUSDC' },
        allNetworkTokensData: [{ token_id: TOKEN_ID, number_of_decimals: 2 }],
      },
    })

    // coin truth at coin scale — not the injected token-scaled identity
    expect(screen.getByText('100000 ML')).toBeInTheDocument()
    expect(screen.queryByText(/MLUSDC/)).not.toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('labels a transaction with an intent as a bridge request', () => {
    const intent =
      'bridge::ml-to-mintlayer::destination-9876543210abcdefghijklmnopqrstuvwxyz'
    renderSummary({ intent })

    expect(screen.getByText('Bridge transaction')).toBeInTheDocument()
    expect(screen.getByText('Bridge', { exact: true })).toBeInTheDocument()

    // SECURITY: the intent is signed raw — it must render IN FULL, never
    // truncated, and it gets its own copy button
    expect(screen.getByText('Bridge intent')).toBeInTheDocument()
    expect(screen.getByText(intent)).toBeInTheDocument()
    expect(screen.getAllByTestId('copy-btn')).toHaveLength(3)
  })

  it('falls back to a generic header for an unknown operation', () => {
    renderSummary({
      jsonRepresentation: {
        ...transferJsonRepresentation,
        outputs: [
          {
            type: 'MysteryOperation',
            destination: DESTINATION,
            value: coin('25'),
          },
        ],
      },
    })

    expect(screen.getByText('Transaction')).toBeInTheDocument()
  })

  it('uses the token ticker and scales by the chain-metadata decimals for a token transfer', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: token(TOKEN_ID, '25', '2500', 2),
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: token(TOKEN_ID, '25', '2500', 2),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
      mintlayerValue: {
        tokenMap: { [TOKEN_ID]: 'MLUSDC' },
        allNetworkTokensData: [{ token_id: TOKEN_ID, number_of_decimals: 2 }],
      },
    })

    // 2500 atoms at 2 decimals = 25 MLUSDC, derived from atoms
    expect(screen.getByText('25 MLUSDC')).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('shows a token unknown to chain data as a raw atom count', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: {
              destination: OWN_RECEIVING,
              value: token(TOKEN_ID, null, '91400'),
            },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: DESTINATION,
            value: token(TOKEN_ID, null, '91400'),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
      mintlayerValue: { tokenMap: {} },
    })

    // no chain decimals → only the verbatim signed atom count is showable
    expect(screen.getByText(/91400/)).toBeInTheDocument()
    expect(screen.queryByTestId('approval-blocked')).not.toBeInTheDocument()
  })

  it('shows amount and recipient for a self-transfer back to the wallet', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_CHANGE, value: coin('100') },
          },
        ],
        outputs: [
          // the payment goes to a receiving address of this same wallet…
          { type: 'Transfer', destination: OWN_RECEIVING, value: coin('25') },
          // …while the change only returns the unspent remainder
          {
            type: 'Transfer',
            destination: OWN_CHANGE,
            value: coin('74.99'),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('Send')).toBeInTheDocument()
    expect(screen.getByText('To (your address)')).toBeInTheDocument()

    // From and To are the same address here
    const occurrences = screen.getAllByText(truncated(OWN_RECEIVING))
    expect(occurrences).toHaveLength(2)

    // the payment amount is visible, the change is not counted
    expect(screen.getByText('25 ML')).toBeInTheDocument()
    expect(screen.queryByText('74.99 ML')).not.toBeInTheDocument()
    // fee computed from the atom sums: 100 − 25 − 74.99 = 0.01
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
  })

  it('sums multiple approved outputs per asset', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('25') },
          {
            type: 'Transfer',
            destination: 'mtc1qsecondrecipient0abcdefgh',
            value: coin('10'),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('35 ML')).toBeInTheDocument()
  })

  it('does not claim a self-transfer when only change addresses receive', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [
          {
            type: 'Transfer',
            destination: OWN_CHANGE,
            value: coin('99.99'),
          },
        ],
        fee: { decimal: '0.01', atoms: toAtoms('0.01') },
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.queryByText('To (your address)')).not.toBeInTheDocument()
    // no Amount row: the only output is change, not a payment
    expect(screen.queryByText('Amount')).not.toBeInTheDocument()
  })

  // The signer encodes `destination` for Transfer, LockThenTransfer and
  // CreateDelegationId outputs only: an Htlc or staking output moves its
  // funds elsewhere whatever `destination`/`address` the payload attaches
  // to it, so those fields must never become the "To" line.
  it('derives the To line from the first relevant output whose type carries a destination', () => {
    const decoyEscrow = {
      type: 'Htlc',
      destination: OWN_RECEIVING,
      address: OWN_CHANGE,
      value: coin('16071.486043'),
      htlc: { spend_key: 'mtc1qdappspendkey', refund_key: 'mtc1qdapprefund' },
    }
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('17081.486043') },
          },
        ],
        // the decoy-tagged escrow comes first; the payment is a Transfer
        outputs: [
          decoyEscrow,
          { type: 'Transfer', destination: DESTINATION, value: coin('10') },
        ],
        fee: { decimal: '0', atoms: '0' },
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.queryByText('To (your address)')).not.toBeInTheDocument()
    // the wallet's own address appears as From only
    expect(screen.getAllByText(truncated(OWN_RECEIVING))).toHaveLength(1)
    expect(screen.getByText(truncated(DESTINATION))).toBeInTheDocument()
    // both outputs leave the wallet: 16071.486043 + 10
    expect(screen.getByText('16081.486043 ML')).toBeInTheDocument()
  })

  it('shows the neutral placeholder when no relevant output carries a signed destination', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('17081.486043') },
          },
        ],
        outputs: [
          {
            type: 'Htlc',
            destination: OWN_RECEIVING,
            value: coin('16071.486043'),
            htlc: {
              spend_key: 'mtc1qdappspendkey',
              refund_key: 'mtc1qdapprefund',
            },
          },
          {
            type: 'DelegateStaking',
            destination: OWN_RECEIVING,
            amount: { decimal: '10', atoms: toAtoms('10') },
            delegation_id: 'd1',
          },
        ],
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.queryByText('To (your address)')).not.toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(1)
    expect(screen.getAllByText(truncated(OWN_RECEIVING))).toHaveLength(1)
    // only From has a copy button: there is no To address to copy
    expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
    expect(screen.getByText('16081.486043 ML')).toBeInTheDocument()
  })

  it('does not take the From address from a utxo injected on an account input', () => {
    // LEG-KIND REGRESSION: the signer reads utxo fields only for input_type
    // 'UTXO' legs — an injected utxo destination on an account-command input
    // must not fake where funds come from; the real UTXO leg wins instead
    const injected = 'mtc1qinjected0123456789abcdef0123456789'
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: {
              input_type: 'AccountCommand',
              command: 'ConcludeOrder',
              order_id: 'order-1',
              nonce: '0',
            },
            utxo: { destination: injected },
          },
          {
            input: { input_type: 'UTXO' },
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: coin('100') },
          },
        ],
        outputs: [],
      },
    })

    expect(screen.getByText('Conclude order')).toBeInTheDocument()
    // From is the genuine utxo leg, never the injected destination
    expect(screen.getByText(truncated(OWN_RECEIVING))).toBeInTheDocument()
    expect(screen.queryByText(injected)).not.toBeInTheDocument()
    expect(screen.queryByText(truncated(injected))).not.toBeInTheDocument()
  })

  // A FillOrder input's `destination` is where the acquired asset lands and
  // the input carries no signature (encode_witness_no_signature): it is
  // never the source of funds, whatever address it names. `.address` is
  // read by the signer nowhere.
  const FILL_PROCEEDS = 'mtc1qfillproceedsdestination' // a second wallet address
  const FOREIGN_UTXO = 'mtc1qforeignutxoowner'
  const fillOrderInput = (destination, fields = {}) => ({
    input: {
      input_type: 'AccountCommand',
      command: 'FillOrder',
      order_id: 'order-1',
      fill_atoms: '1000000000000',
      nonce: '0',
      ...fields,
      destination,
    },
    utxo: null,
  })
  const utxoInput = (destination, decimal) => ({
    input: { input_type: 'UTXO' },
    utxo: { type: 'Transfer', destination, value: coin(decimal) },
  })
  const WITH_FILL_KEY = {
    receiving: [OWN_RECEIVING, FILL_PROCEEDS],
    change: [OWN_CHANGE],
  }

  it('does not take the From address from a FillOrder destination', () => {
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [
          fillOrderInput(FILL_PROCEEDS),
          utxoInput(OWN_RECEIVING, '100'),
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('25') },
        ],
      },
    })

    expect(screen.getByText('Fill order')).toBeInTheDocument()
    // From is the utxo's address, never the fill's proceeds destination
    expect(screen.getByText('From').nextElementSibling).toHaveTextContent(
      truncated(OWN_RECEIVING),
    )
    expect(screen.getByText('To').nextElementSibling).toHaveTextContent(
      truncated(DESTINATION),
    )
  })

  it('shows the utxo source, not a FillOrder destination, when no leg is the wallet', () => {
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [fillOrderInput(FILL_PROCEEDS), utxoInput(FOREIGN_UTXO, '100')],
        outputs: [],
      },
    })

    // the foreign utxo is where the funds come from; the fill's destination
    // names only where the acquired asset goes
    expect(screen.getByText('From').nextElementSibling).toHaveTextContent(
      FOREIGN_UTXO,
    )
    expect(screen.getByText(/^To/).nextElementSibling).toHaveTextContent(
      truncated(FILL_PROCEEDS),
    )
  })

  it('never takes the From address from an `address` field', () => {
    const addressOnly = {
      input: { input_type: 'UTXO' },
      utxo: { address: FILL_PROCEEDS, value: coin('1') },
    }
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [addressOnly, utxoInput(OWN_RECEIVING, '100')],
        outputs: [],
      },
    })

    expect(screen.getByText('From').nextElementSibling).toHaveTextContent(
      truncated(OWN_RECEIVING),
    )
    // the `address` value appears nowhere on the summary
    expect(screen.queryByText(truncated(FILL_PROCEEDS))).not.toBeInTheDocument()
  })

  it('shows the placeholder when a utxo names its address only through `address`', () => {
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            utxo: { address: FILL_PROCEEDS, value: coin('1') },
          },
        ],
        outputs: [],
      },
    })

    // From and To both show the placeholder: nothing to copy
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.queryByTestId('copy-btn')).not.toBeInTheDocument()
  })

  // An Htlc utxo carries no destination: the signer signs it with the key
  // of its spend key (a claim) or else of its refund key.
  it.each([
    ['spend_key', true],
    ['refund_key', true],
    ['keys the wallet does not hold', false],
  ])('takes the From address of an Htlc utxo from its %s', (keys, owned) => {
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input: { input_type: 'UTXO' },
            utxo: {
              type: 'Htlc',
              value: coin('10'),
              htlc: {
                spend_key:
                  keys === 'spend_key' ? OWN_RECEIVING : 'mtc1qdappspendkey',
                refund_key:
                  keys === 'refund_key' ? OWN_RECEIVING : 'mtc1qdapprefund',
              },
            },
          },
        ],
        outputs: [],
      },
    })

    if (owned) {
      expect(screen.getByText(truncated(OWN_RECEIVING))).toBeInTheDocument()
    } else {
      // neither key is the wallet's: the utxo is not its funds, so no
      // source address is claimed (From and To both show the placeholder)
      expect(
        screen.queryByText(truncated(OWN_RECEIVING)),
      ).not.toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(2)
      expect(screen.queryByTestId('copy-btn')).not.toBeInTheDocument()
    }
  })

  // The signer encodes `destination` on an account-command FillOrder input
  // as well — where the acquired asset lands — so it may name the "To"
  // line when no output carries a destination the signer encodes.
  it('falls back to the FillOrder destination for the To line', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [fillOrderInput(DESTINATION), utxoInput(OWN_RECEIVING, '100')],
        outputs: [],
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText(truncated(DESTINATION))).toBeInTheDocument()
    // one copy button each for From and To
    expect(screen.getAllByTestId('copy-btn')).toHaveLength(2)
  })

  it('keeps an output destination ahead of a FillOrder destination', () => {
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [
          fillOrderInput(FILL_PROCEEDS),
          utxoInput(OWN_RECEIVING, '100'),
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: coin('25') },
        ],
      },
    })

    expect(screen.getByText(truncated(DESTINATION))).toBeInTheDocument()
    expect(screen.queryByText(truncated(FILL_PROCEEDS))).not.toBeInTheDocument()
  })

  it('does not label a FillOrder destination as the wallet', () => {
    // every output returns to a change address while the fill sends the
    // acquired asset elsewhere: not a transfer back to the wallet
    renderSummary({
      jsonRepresentation: {
        inputs: [fillOrderInput(DESTINATION), utxoInput(OWN_RECEIVING, '100')],
        outputs: [
          { type: 'Transfer', destination: OWN_CHANGE, value: coin('99') },
        ],
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.queryByText('To (your address)')).not.toBeInTheDocument()
    expect(screen.getByText(truncated(DESTINATION))).toBeInTheDocument()
  })

  it.each([
    ['a non-string destination', fillOrderInput(42)],
    ['an `address` field', fillOrderInput(undefined, { address: DESTINATION })],
    [
      'a UTXO leg injected with the command',
      {
        input: {
          input_type: 'UTXO',
          command: 'FillOrder',
          destination: DESTINATION,
          index: 0,
        },
        utxo: null,
      },
    ],
  ])(
    'keeps the neutral placeholder for %s on a FillOrder leg',
    (_description, input) => {
      renderSummary({
        jsonRepresentation: {
          inputs: [input, utxoInput(OWN_RECEIVING, '100')],
          outputs: [],
        },
      })

      expect(screen.getByText('To')).toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(1)
      // only From has a copy button
      expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
    },
  )

  // Beside a relevant output that carries a signed amount, "To" must not
  // name a fill destination: the Amount row would read as what goes to that
  // address, while the funds of the Htlc/staking output go elsewhere. The
  // fill destination is named only when no relevant output carries a
  // signed amount at all.
  it.each([
    [
      'an Htlc output',
      {
        type: 'Htlc',
        value: coin('10'),
        htlc: { spend_key: 'mtc1qdappspendkey', refund_key: 'mtc1qdapprefund' },
      },
    ],
    [
      'a DelegateStaking output',
      {
        type: 'DelegateStaking',
        amount: coin('10').amount,
        delegation_id: 'd1',
      },
    ],
  ])(
    'keeps the placeholder when the amount goes to %s beside a fill',
    (_description, escrowOutput) => {
      renderSummary({
        jsonRepresentation: {
          // the fill's proceeds go to the wallet's receiving address R
          inputs: [
            utxoInput(OWN_RECEIVING, '100'),
            fillOrderInput(OWN_RECEIVING),
          ],
          outputs: [
            escrowOutput,
            {
              type: 'Transfer',
              destination: OWN_CHANGE,
              value: coin('89.99'),
            },
          ],
        },
      })

      // the Amount row is the 10 ML escrowed, which never reaches R
      expect(screen.getByText('10 ML')).toBeInTheDocument()
      expect(screen.getByText('To')).toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(1)
      // only From has a copy button
      expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
    },
  )

  // A pure fill that returns its change to a RECEIVING address of the
  // wallet: that change output is the relevant output, so "To" names it as
  // the wallet's own address beside its own amount. True on both counts —
  // the Transfer's destination is signer-encoded, and the Amount row is
  // exactly what it pays. The fill's destination does not replace it.
  it('names the change output of a pure fill, not the fill destination', () => {
    const CHANGE_RECEIVING = 'mtc1qsecondreceivingaddress'
    renderSummary({
      ownAddresses: {
        receiving: [OWN_RECEIVING, CHANGE_RECEIVING],
        change: [OWN_CHANGE],
      },
      jsonRepresentation: {
        inputs: [fillOrderInput(DESTINATION), utxoInput(OWN_RECEIVING, '100')],
        outputs: [
          {
            type: 'Transfer',
            destination: CHANGE_RECEIVING,
            value: coin('99'),
          },
        ],
      },
    })

    expect(screen.getByText('To (your address)')).toBeInTheDocument()
    expect(
      screen.getByText('To (your address)').nextElementSibling,
    ).toHaveTextContent(truncated(CHANGE_RECEIVING))
    // the Amount row is what that Transfer pays back
    expect(screen.getByText('99 ML')).toBeInTheDocument()
    expect(screen.queryByText(truncated(DESTINATION))).not.toBeInTheDocument()
  })

  // The same fill with its change returning to a CHANGE address: change is
  // not a payment, so no relevant output remains and "To" names the fill's
  // destination — where the acquired asset lands — with no Amount row beside
  // it. Nothing on screen is attributed to an address it does not go to.
  it('names the fill destination when a pure fill returns change to a change address', () => {
    renderSummary({
      jsonRepresentation: {
        inputs: [fillOrderInput(DESTINATION), utxoInput(OWN_RECEIVING, '100')],
        outputs: [
          { type: 'Transfer', destination: OWN_CHANGE, value: coin('99') },
        ],
      },
    })

    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.getByText('To').nextElementSibling).toHaveTextContent(
      truncated(DESTINATION),
    )
    expect(screen.queryByText('Amount')).not.toBeInTheDocument()
    // the order leg makes the fee unverifiable, so no number is derived
    // from the change either
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  // An order or a token issuance resolves no amount container but still
  // shows signed amounts as extra rows. Beside those the fill destination
  // must not be named either: the order's funds are escrowed to its conclude
  // address and the supply belongs to the issuance, neither to R.
  it.each([
    [
      'a CreateOrder output',
      'Order give',
      '100 ML',
      {
        type: 'CreateOrder',
        ask_currency: { type: 'Coin' },
        ask_balance: { decimal: '1', atoms: toAtoms('1') },
        give_currency: { type: 'Coin' },
        give_balance: { decimal: '100', atoms: toAtoms('100') },
        conclude_destination: 'mtc1qattackerconclude',
      },
    ],
    [
      'a token issuance output',
      'Total supply',
      '100',
      {
        type: 'IssueFungibleToken',
        token_ticker: { string: 'TST', hex: '00' },
        metadata_uri: { string: '', hex: '' },
        total_supply: {
          type: 'Fixed',
          amount: { decimal: '100', atoms: '100' },
        },
        number_of_decimals: 0,
        authority: 'mtc1qissuer',
        is_freezable: false,
      },
    ],
  ])(
    'keeps the placeholder beside the signed rows of %s',
    (_description, rowLabel, rowText, escrowOutput) => {
      renderSummary({
        jsonRepresentation: {
          // the fill's proceeds go to the wallet's receiving address R
          inputs: [
            utxoInput(OWN_RECEIVING, '100'),
            fillOrderInput(OWN_RECEIVING),
          ],
          outputs: [escrowOutput],
        },
      })

      // the output's own signed row is shown …
      expect(screen.getByText(rowLabel).nextElementSibling).toHaveTextContent(
        rowText,
      )
      // … and "To" names neither R nor the conclude address
      expect(screen.getByText('To')).toBeInTheDocument()
      expect(screen.getAllByText('—')).toHaveLength(1)
      expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
    },
  )

  // One "To" line cannot stand for several fills: it names their
  // destination only when every fill carrying a string destination names
  // the same one. Each fill's own destination is shown on its own row in
  // the technical breakdown.
  it('keeps the placeholder when fills go to different addresses', () => {
    renderSummary({
      ownAddresses: WITH_FILL_KEY,
      jsonRepresentation: {
        inputs: [
          utxoInput(OWN_RECEIVING, '100'),
          // one fill's proceeds go to the wallet's receiving address R…
          fillOrderInput(FILL_PROCEEDS),
          // …and another's to an address outside the wallet
          fillOrderInput('mtc1qattackerproceeds'),
        ],
        outputs: [
          { type: 'Transfer', destination: OWN_CHANGE, value: coin('99') },
        ],
      },
    })

    // both fills are listed, each with its committed size
    expect(screen.getAllByText('Order fill')).toHaveLength(2)
    // no single address receives them: no "To" address, no copy button
    expect(screen.getByText('To')).toBeInTheDocument()
    expect(screen.queryByText('To (your address)')).not.toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(1)
    expect(screen.getAllByTestId('copy-btn')).toHaveLength(1)
    // R appears nowhere on the summary
    expect(screen.queryByText(truncated(FILL_PROCEEDS))).not.toBeInTheDocument()
  })

  it.each([
    ['an address outside the wallet', DESTINATION, 'To'],
    ['a receiving address of the wallet', FILL_PROCEEDS, 'To (your address)'],
  ])(
    'names the one destination two fills share when both go to %s',
    (_which, destination, label) => {
      renderSummary({
        ownAddresses: WITH_FILL_KEY,
        jsonRepresentation: {
          inputs: [
            utxoInput(OWN_RECEIVING, '100'),
            fillOrderInput(destination),
            fillOrderInput(destination),
          ],
          outputs: [
            { type: 'Transfer', destination: OWN_CHANGE, value: coin('99') },
          ],
        },
      })

      expect(screen.getAllByText('Order fill')).toHaveLength(2)
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.getByText(label).nextElementSibling).toHaveTextContent(
        truncated(destination),
      )
      // From and To each have a copy button
      expect(screen.getAllByTestId('copy-btn')).toHaveLength(2)
    },
  )
})
