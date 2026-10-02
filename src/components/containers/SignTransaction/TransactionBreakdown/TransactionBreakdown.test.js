import { render, screen } from '@testing-library/react'

import { MOCKS } from '../../../../pages/SignExternalTransaction/mocks'
import TransactionBreakdown from './TransactionBreakdown'

const jsonOf = (mock) => mock.request.data.txData.JSONRepresentation

const renderBreakdown = (mock, ownAddresses = {}) =>
  render(
    <TransactionBreakdown
      JSONRepresentation={jsonOf(mock)}
      ownAddresses={ownAddresses}
      tokenMap={{}}
      coinTicker="TML"
    />,
  )

describe('TransactionBreakdown', () => {
  it('lists every input and output of the transaction', () => {
    const json = jsonOf(MOCKS.transfer)
    renderBreakdown(MOCKS.transfer)

    expect(
      screen.getByText(`Inputs (${json.inputs.length})`),
    ).toBeInTheDocument()
    expect(
      screen.getByText(`Outputs (${json.outputs.length})`),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Transfer')).toHaveLength(
      json.inputs.length + json.outputs.length,
    )
  })

  it('shows the amount that leaves the wallet, fee included', () => {
    // 17071.486043 spent, 17059.486043 returned as change, 10 sent, 2 fee
    renderBreakdown(MOCKS.transfer, {
      receiving: ['tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'],
      change: [],
    })

    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      '\u221212 TML',
    )
  })

  it('marks the addresses that belong to the wallet', () => {
    renderBreakdown(MOCKS.transfer, {
      receiving: ['tmt1qxrwc3gy2lgf4kvqwwfa388vn3cavgrqyyrgswe6'],
      change: [],
    })

    expect(screen.getAllByText('Your address')).toHaveLength(2)
  })

  it('counts what a delegation withdrawal brings back', () => {
    renderBreakdown(MOCKS.delegationWithdraw, {
      receiving: ['tmt1q9l0g4kd3s6x5rmesaznegz06pw9hxu6qvqu3pa7'],
      change: [],
    })

    expect(screen.getByTestId('balance-change')).toHaveTextContent('+8 TML')
    expect(screen.getByText('DelegationBalance')).toBeInTheDocument()
  })

  it('keeps coin amounts at eleven decimals and out of exponent notation', () => {
    const own = 'tmt1qown'
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [
            {
              input: { input_type: 'UTXO' },
              utxo: {
                type: 'Transfer',
                destination: own,
                value: { type: 'Coin', amount: { decimal: '0.00000000002' } },
              },
            },
          ],
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: { type: 'Coin', amount: { decimal: '0.00000000001' } },
            },
          ],
        }}
        ownAddresses={{ receiving: [own] }}
        coinTicker="TML"
      />,
    )

    expect(screen.getByTestId('balance-change')).toHaveTextContent(
      '\u22120.00000000001 TML',
    )
  })

  it('spells out a lock instead of dumping its json', () => {
    renderBreakdown(MOCKS.delegationWithdraw)

    expect(screen.getByText('for 7200 blocks')).toBeInTheDocument()
    expect(screen.queryByText(/ForBlockCount/)).not.toBeInTheDocument()
  })

  it('opens nested fields into readable lines', () => {
    renderBreakdown(MOCKS.issueNft)

    expect(screen.getAllByText('name').length).toBeGreaterThan(0)
  })

  it('says so when no funds of this wallet move', () => {
    renderBreakdown(MOCKS.transfer)

    expect(
      screen.getByText(
        'This transaction does not move funds held by this wallet.',
      ),
    ).toBeInTheDocument()
  })
})
