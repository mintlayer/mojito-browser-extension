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

const coin = (decimal) => ({ type: 'Coin', amount: { decimal } })

const transferJsonRepresentation = {
  inputs: [
    {
      input_type: 'UTXO',
      utxo: { destination: OWN_RECEIVING, value: coin('100') },
    },
  ],
  outputs: [{ type: 'Transfer', destination: DESTINATION, value: coin('25') }],
  fee: { decimal: '0.01' },
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
    expect(screen.getByText('0.01 ML')).toBeInTheDocument()
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

  it('labels a transaction with an intent as a bridge request', () => {
    const intent =
      'bridge::ml-to-mintlayer::destination-9876543210abcdefghijklmnopqrstuvwxyz'
    renderSummary({ intent })

    expect(screen.getByText('Bridge transaction')).toBeInTheDocument()
    expect(screen.getByText('Bridge', { exact: true })).toBeInTheDocument()

    // the intent row renders with the (bounded) intent and its own copy button
    expect(screen.getByText('Bridge intent')).toBeInTheDocument()
    expect(screen.getByText(`${intent.slice(0, 64)}…`)).toBeInTheDocument()
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

  it('uses the token ticker for a token transfer', () => {
    const tokenValue = {
      type: 'TokenV1',
      token_id: TOKEN_ID,
      amount: { decimal: '25' },
    }
    renderSummary({
      jsonRepresentation: {
        inputs: [
          {
            input_type: 'UTXO',
            utxo: { destination: OWN_RECEIVING, value: tokenValue },
          },
        ],
        outputs: [
          { type: 'Transfer', destination: DESTINATION, value: tokenValue },
        ],
        fee: { decimal: '0.01' },
      },
      mintlayerValue: { tokenMap: { [TOKEN_ID]: 'MLUSDC' } },
    })

    expect(screen.getByText('25 MLUSDC')).toBeInTheDocument()
  })
})
