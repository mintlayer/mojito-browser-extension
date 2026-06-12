import { render, screen } from '@testing-library/react'
import { MintlayerContext } from '@Contexts'
import LockedBalanceList from './LockedBalanceList'

const makeUtxo = (sourceId, index, lockType, lockContent, amount) => ({
  outpoint: { source_id: sourceId, index },
  utxo: {
    type: 'LockThenTransfer',
    lock: { type: lockType, content: lockContent },
    value: { amount: { decimal: String(amount) } },
  },
})

const baseTx = {
  txid: 'tx1',
  confirmations: 50,
  date: '1700000000',
}

const defaultContext = {
  lockedUtxos: [],
  lockedBalance: 0,
  transactions: [],
  fetchingUtxos: false,
  currentHeight: 1000,
}

const renderWith = (ctx) =>
  render(
    <MintlayerContext.Provider value={{ ...defaultContext, ...ctx }}>
      <LockedBalanceList />
    </MintlayerContext.Provider>,
  )

describe('LockedBalanceList', () => {
  it('shows loading when fetchingUtxos is true', () => {
    renderWith({ fetchingUtxos: true })

    expect(screen.queryByText('Locked coins')).not.toBeInTheDocument()
    expect(document.querySelector('[class*="loadingWrapper"]')).toBeTruthy()
  })

  it('renders header and footer when not loading', () => {
    renderWith({})

    expect(screen.getByText('Locked coins')).toBeInTheDocument()
    expect(screen.getByText(/Unlock times are estimates/)).toBeInTheDocument()
  })

  it('shows total locked from lockedBalance context value', () => {
    renderWith({ lockedBalance: 500 })

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('calculates total from UTXOs when lockedBalance is falsy', () => {
    const utxo = makeUtxo('tx1', 0, 'ForBlockCount', 100, 25.5)
    renderWith({
      lockedBalance: 0,
      lockedUtxos: [utxo],
      transactions: [baseTx],
    })

    const summary = document.querySelector('[class*="summaryValue"]')
    expect(summary).toHaveTextContent('25.5')
  })

  it('renders ForBlockCount UTXOs as list items', () => {
    const utxo = makeUtxo('tx1', 0, 'ForBlockCount', 100, 10)
    renderWith({
      lockedUtxos: [utxo],
      transactions: [baseTx],
    })

    const items = document.querySelectorAll('li')
    expect(items).toHaveLength(1)
  })

  it('renders UntilTime UTXOs as list items', () => {
    const utxo = makeUtxo('tx2', 0, 'UntilTime', 1700050000, 20)
    renderWith({ lockedUtxos: [utxo] })

    const items = document.querySelectorAll('li')
    expect(items).toHaveLength(1)
  })

  it('filters out UTXOs with no matching transaction', () => {
    const utxo = makeUtxo('unknown_tx', 0, 'ForBlockCount', 100, 10)
    renderWith({
      lockedUtxos: [utxo],
      transactions: [baseTx],
    })

    const items = document.querySelectorAll('li')
    expect(items).toHaveLength(0)
  })

  it('filters out UTXOs with negative blocksToUnlock', () => {
    const utxo = makeUtxo('tx1', 0, 'ForBlockCount', 100, 10)
    const tx = { ...baseTx, confirmations: 200 }
    renderWith({
      lockedUtxos: [utxo],
      transactions: [tx],
    })

    const items = document.querySelectorAll('li')
    expect(items).toHaveLength(0)
  })

  it('filters out UTXOs with unknown lock type', () => {
    const utxo = makeUtxo('tx1', 0, 'UnknownType', 100, 10)
    renderWith({
      lockedUtxos: [utxo],
      transactions: [baseTx],
    })

    const items = document.querySelectorAll('li')
    expect(items).toHaveLength(0)
  })

  it('shows singular badge for 1 item', () => {
    const utxo = makeUtxo('tx1', 0, 'ForBlockCount', 100, 10)
    renderWith({
      lockedUtxos: [utxo],
      transactions: [baseTx],
    })

    expect(screen.getByText(/1 ACTIVE LOCK$/)).toBeInTheDocument()
  })

  it('shows plural badge for multiple items', () => {
    const utxo1 = makeUtxo('tx1', 0, 'ForBlockCount', 100, 10)
    const utxo2 = makeUtxo('tx1', 1, 'ForBlockCount', 200, 20)
    renderWith({
      lockedUtxos: [utxo1, utxo2],
      transactions: [baseTx],
    })

    expect(screen.getByText(/2 ACTIVE LOCKS/)).toBeInTheDocument()
  })

  it('hides badge when list is empty', () => {
    renderWith({})

    expect(screen.queryByText(/ACTIVE LOCK/)).not.toBeInTheDocument()
  })

  it('sorts UTXOs by timestamp ascending', () => {
    const utxo1 = makeUtxo('tx1', 0, 'UntilTime', 1700090000, 10)
    const utxo2 = makeUtxo('tx2', 0, 'UntilTime', 1700010000, 20)
    renderWith({ lockedUtxos: [utxo1, utxo2] })

    const amounts = document.querySelectorAll('li p[class*="cardAmount"]')
    expect(amounts[0]).toHaveTextContent('20')
    expect(amounts[1]).toHaveTextContent('10')
  })
})
