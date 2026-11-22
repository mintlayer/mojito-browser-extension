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
                value: {
                  type: 'Coin',
                  amount: { decimal: '0.00000000002', atoms: '2' },
                },
              },
            },
          ],
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: {
                type: 'Coin',
                amount: { decimal: '0.00000000001', atoms: '1' },
              },
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

  it('shows the signed-atom amount even when the decimal label is absent', () => {
    const own = 'tmt1qown'
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [],
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: { type: 'Coin', amount: { atoms: '2500000000000' } },
            },
          ],
        }}
        ownAddresses={{ receiving: [own] }}
        coinTicker="TML"
      />,
    )

    // 2500000000000 atoms = 25 TML, derived from atoms alone
    expect(screen.getByTestId('balance-change')).toHaveTextContent('+25 TML')
  })

  // SECURITY REGRESSION:
  // a tampered decimal label on an owned output must never render — the row
  // fails closed with the signed truth and the hero refuses to show numbers.
  it('fails closed when an owned amount does not reconcile with its atoms', () => {
    const own = 'tmt1qown'
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [],
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: {
                type: 'Coin',
                amount: { decimal: '1', atoms: '800000000000' },
              },
            },
          ],
        }}
        ownAddresses={{ receiving: [own] }}
        coinTicker="TML"
      />,
    )

    // no fake number in the hero
    expect(screen.queryByTestId('balance-change')).not.toBeInTheDocument()
    expect(
      screen.getByText(/could not be verified against the signed/),
    ).toBeInTheDocument()
    // the row shows the fail-closed error plus the amount that WILL be signed
    expect(
      screen.getByText(/does not match the amount that will be signed/),
    ).toBeInTheDocument()
    expect(screen.getByText(/will sign 8/)).toBeInTheDocument()
  })

  it('scales token amounts by the chain-metadata decimals from context', () => {
    const { MintlayerContext } = require('@Contexts')
    const own = 'tmt1qown'
    const tokenId = 'tmltk1test'
    render(
      <MintlayerContext.Provider
        value={{
          allNetworkTokensData: [{ token_id: tokenId, number_of_decimals: 2 }],
        }}
      >
        <TransactionBreakdown
          JSONRepresentation={{
            inputs: [],
            outputs: [
              {
                type: 'Transfer',
                destination: own,
                value: {
                  type: 'TokenV1',
                  token_id: tokenId,
                  amount: { decimal: '25', atoms: '2500' },
                },
              },
            ],
          }}
          ownAddresses={{ receiving: [own] }}
          tokenMap={{ [tokenId]: 'MLUSDC' }}
          coinTicker="TML"
        />
      </MintlayerContext.Provider>,
    )

    // 2500 atoms at 2 decimals = 25 MLUSDC
    expect(screen.getByTestId('balance-change')).toHaveTextContent('+25 MLUSDC')
  })

  it('keys balance-change rows by asset, tolerating duplicate tickers', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const own = 'tmt1qown'
    const tokenIdA = 'tmltk1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const tokenIdB = 'tmltk1bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [],
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: {
                type: 'TokenV1',
                token_id: tokenIdA,
                amount: { decimal: '100', atoms: '100' },
              },
            },
            {
              type: 'Transfer',
              destination: own,
              value: {
                type: 'TokenV1',
                token_id: tokenIdB,
                amount: { decimal: '200', atoms: '200' },
              },
            },
          ],
        }}
        ownAddresses={{ receiving: [own] }}
        // two different tokens sharing a ticker — the old label-based
        // React keys collided here
        tokenMap={{ [tokenIdA]: 'DUP', [tokenIdB]: 'DUP' }}
        coinTicker="TML"
      />,
    )

    const items = screen.getAllByTestId('balance-change')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('+100 DUP')
    expect(items[1]).toHaveTextContent('+200 DUP')
    // no duplicate-key React warnings
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
  })

  it('normalizes non-array legs instead of crashing', () => {
    const own = 'tmt1qown'
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: {},
          outputs: [
            {
              type: 'Transfer',
              destination: own,
              value: {
                type: 'Coin',
                amount: { decimal: '100', atoms: '10000000000000' },
              },
            },
          ],
        }}
        ownAddresses={{ receiving: [own] }}
        coinTicker="TML"
      />,
    )

    expect(screen.getByText('Outputs (1)')).toBeInTheDocument()
    expect(screen.getByTestId('balance-change')).toHaveTextContent('+100 TML')
  })

  it('resolves the DelegateStaking amount container per type in rows', () => {
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [],
          outputs: [
            {
              type: 'DelegateStaking',
              // attacker-chosen display value…
              value: {
                type: 'Coin',
                amount: { atoms: '1000', decimal: '0.00000000001' },
              },
              // …vs the 99 ML the signer actually escrows
              amount: { atoms: '9900000000000', decimal: '99' },
              delegation_id: 'd1',
            },
          ],
        }}
        ownAddresses={{}}
        coinTicker="TML"
      />,
    )

    expect(screen.getByText('99 TML')).toBeInTheDocument()
    expect(screen.queryByText('0.00000000001 TML')).not.toBeInTheDocument()
  })

  it('does not render phantom amounts for account inputs without one', () => {
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [
            {
              input: {
                input_type: 'AccountCommand',
                command: 'ConcludeOrder',
                order_id: 'o1',
                nonce: '0',
                // injected top-level numerics the signer never reads
                atoms: '1000000000000',
                decimal: '100',
              },
            },
          ],
          outputs: [],
        }}
        ownAddresses={{}}
        coinTicker="TML"
      />,
    )

    expect(screen.getByText('Inputs (1)')).toBeInTheDocument()
    expect(screen.queryByText('100 TML')).not.toBeInTheDocument()
  })

  it('does not fake a value row for an account input injected with type Transfer', () => {
    // LEG-KIND REGRESSION: Transfer is an output type — the resolver must
    // never take the value branch for an account input, whatever type the
    // payload injects on it
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [
            {
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
        }}
        ownAddresses={{}}
        coinTicker="TML"
      />,
    )

    expect(screen.getByText('Inputs (1)')).toBeInTheDocument()
    expect(screen.queryByText('10 TML')).not.toBeInTheDocument()
  })

  it('does not fabricate amount rows for injected commands on outputs', () => {
    // LEG-KIND REGRESSION: the signer reads command/account_type on inputs
    // only — an output with injected MintTokens/DelegationBalance fields and
    // a consistent amount encodes nothing signable
    render(
      <TransactionBreakdown
        JSONRepresentation={{
          inputs: [],
          outputs: [
            {
              type: 'CreateDelegationId',
              pool_id: 'p1',
              input_type: 'AccountCommand',
              command: 'MintTokens',
              token_id: 'tmltk1cheap',
              account_type: 'DelegationBalance',
              amount: { atoms: '2500000000000', decimal: '25' },
            },
          ],
        }}
        ownAddresses={{}}
        coinTicker="TML"
      />,
    )

    expect(screen.getByText('Outputs (1)')).toBeInTheDocument()
    expect(screen.queryByText('25 TML')).not.toBeInTheDocument()
    expect(
      screen.queryByText(/does not match the amount that will be signed/),
    ).not.toBeInTheDocument()
  })

  it('scales MintTokens amounts by the command-level token decimals', () => {
    const tokenId = 'tmltk1mint'
    const { MintlayerContext } = require('@Contexts')
    render(
      <MintlayerContext.Provider
        value={{
          allNetworkTokensData: [{ token_id: tokenId, number_of_decimals: 18 }],
        }}
      >
        <TransactionBreakdown
          JSONRepresentation={{
            inputs: [
              {
                input: {
                  input_type: 'AccountCommand',
                  command: 'MintTokens',
                  token_id: tokenId,
                  amount: {
                    decimal: '1.5',
                    atoms: '1500000000000000000',
                  },
                  nonce: '0',
                },
              },
            ],
            outputs: [],
          }}
          ownAddresses={{}}
          tokenMap={{ [tokenId]: 'MINT' }}
          coinTicker="TML"
        />
      </MintlayerContext.Provider>,
    )

    // 1.5e18 atoms at 18 decimals = 1.5 MINT (previously rendered at coin
    // scale as 15000000 TML)
    expect(screen.getByText('Inputs (1)')).toBeInTheDocument()
    expect(screen.getByText('1.5 MINT')).toBeInTheDocument()
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
