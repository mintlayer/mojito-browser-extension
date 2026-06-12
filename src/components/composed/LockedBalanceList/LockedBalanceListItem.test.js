import { render, screen } from '@testing-library/react'
import LockedBalanceListItem from './LockedBalanceListItem'

const forBlockCountUtxo = {
  outpoint: { source_id: 'tx1', index: 0 },
  utxo: {
    type: 'LockThenTransfer',
    lock: { type: 'ForBlockCount', content: 100 },
    value: { amount: { decimal: '42.5' } },
  },
  computed: {
    blocksToUnlock: 50,
    unlockHeight: 1050,
    timestamp: 1700000000,
    progress: 0.5,
  },
}

const untilTimeUtxo = {
  outpoint: { source_id: 'tx2', index: 0 },
  utxo: {
    type: 'LockThenTransfer',
    lock: { type: 'UntilTime', content: 1700050000 },
    value: { amount: { decimal: '100' } },
  },
  computed: {
    timestamp: 1700050000,
    progress: 0.5,
  },
}

const renderItem = (utxo) =>
  render(
    <ul>
      <LockedBalanceListItem utxo={utxo} />
    </ul>,
  )

describe('LockedBalanceListItem', () => {
  it('renders amount with ML suffix', () => {
    renderItem(forBlockCountUtxo)

    expect(screen.getByText('42.5')).toBeInTheDocument()
    expect(screen.getByText('ML')).toBeInTheDocument()
  })

  it('renders formatted date', () => {
    renderItem(forBlockCountUtxo)

    expect(screen.getByText(/14\/11\/2023/)).toBeInTheDocument()
  })

  it('renders block badge for ForBlockCount', () => {
    renderItem(forBlockCountUtxo)

    expect(screen.getByText(/Block 1,050/)).toBeInTheDocument()
  })

  it('renders blocks left for ForBlockCount', () => {
    renderItem(forBlockCountUtxo)

    expect(screen.getByText(/unlocks in ~50 blocks/)).toBeInTheDocument()
  })

  it('does not render block badge for UntilTime', () => {
    renderItem(untilTimeUtxo)

    expect(screen.queryByText(/Block /)).not.toBeInTheDocument()
  })

  it('does not render blocks left for UntilTime', () => {
    renderItem(untilTimeUtxo)

    expect(screen.queryByText(/unlocks in/)).not.toBeInTheDocument()
  })

  it('sets progress bar width from progress value', () => {
    renderItem(forBlockCountUtxo)

    const fill = document.querySelector('[class*="progressFill"]')
    expect(fill.style.width).toBe('50%')
  })

  it('handles progress at 100%', () => {
    const utxo = {
      ...forBlockCountUtxo,
      computed: { ...forBlockCountUtxo.computed, progress: 1 },
    }
    renderItem(utxo)

    const fill = document.querySelector('[class*="progressFill"]')
    expect(fill.style.width).toBe('100%')
  })
})
