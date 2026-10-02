import { format } from 'date-fns'
import { render, screen } from '@testing-library/react'
import LockedBalanceListItem from './LockedBalanceListItem'

// The component renders `format(new Date(timestamp * 1000), 'dd/MM/yyyy · HH:mm')`
// using the machine's local timezone. Jest sandboxes the environment, so pinning
// `process.env.TZ` from inside a test file has no effect on date rendering.
// To stay deterministic on any machine, expected strings are computed from the
// SAME timestamp with the SAME date-fns format the component uses. The absolute
// UTC instants of the fixtures are documented below via `toISOString()`, which
// is timezone-independent by definition.
const formatTimestamp = (timestamp) =>
  format(new Date(timestamp * 1000), 'dd/MM/yyyy · HH:mm')

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

    // 1700000000 -> 2023-11-14T22:13:20Z (UTC)
    expect(new Date(1700000000 * 1000).toISOString()).toMatch(
      /^2023-11-14T22:13/,
    )
    expect(
      screen.getByText(new RegExp(escapeRegExp(formatTimestamp(1700000000)))),
    ).toBeInTheDocument()
  })

  it('renders formatted date for UntilTime', () => {
    renderItem(untilTimeUtxo)

    // 1700050000 -> 2023-11-15T12:06:40Z (UTC)
    expect(new Date(1700050000 * 1000).toISOString()).toMatch(
      /^2023-11-15T12:06/,
    )
    expect(
      screen.getByText(new RegExp(escapeRegExp(formatTimestamp(1700050000)))),
    ).toBeInTheDocument()
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
