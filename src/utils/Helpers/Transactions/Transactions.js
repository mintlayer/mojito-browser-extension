import * as Format from '../Number/Format'

const SWAP_TYPES = ['CreateOrder', 'FillOrder']
const STAKE_TYPES = [
  'DelegateStaking',
  'CreateDelegationId',
  'Delegate Withdrawal',
  'CreateStakePool',
]

/**
 * Maps a real wallet transaction (BTC or ML) to the design-system tx shape
 * used by the composed TxRow. Returns `amount: null` for transactions that
 * have no simple numeric amount (swaps, delegations) so the UI renders a
 * neutral dash instead of crashing on object/undefined values.
 */
const adaptDesignTx = (tx, sym, chain) => {
  const isBtc = sym === 'BTC'
  const isSwap = SWAP_TYPES.includes(tx.type)
  const isStake = STAKE_TYPES.includes(tx.type)

  const simpleValue =
    tx.value != null && typeof tx.value !== 'object' ? tx.value : null

  return {
    type: isSwap
      ? 'swap'
      : isStake
        ? 'dapp'
        : tx.direction === 'in'
          ? 'receive'
          : 'send',
    sym,
    chain,
    amount:
      simpleValue == null
        ? null
        : isBtc
          ? Format.BTCValue(simpleValue)
          : simpleValue,
    when: tx.date
      ? new Date(tx.date * 1000).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Pending',
    status: tx.date ? 'Confirmed' : 'Pending',
    hash: tx.txid,
    to: tx.otherPart,
    from: tx.otherPart,
  }
}

export { adaptDesignTx }
