import React, { useContext } from 'react'
import { MintlayerContext } from '@Contexts'
import { Loading } from '@ComposedComponents'
import { ReactComponent as LockIcon } from '@Assets/images/icon-lock.svg'

import LockedBalanceListItem from './LockedBalanceListItem'
import styles from './LockedBalanceList.module.css'

const BLOCK_TIME_SECONDS = 120

const LockedBalanceList = () => {
  const {
    lockedUtxos,
    lockedBalance,
    transactions,
    fetchingUtxos,
    currentHeight,
  } = useContext(MintlayerContext)

  const updatedUtxosList = lockedUtxos
    .map((utxo) => {
      if (utxo.utxo.lock.type === 'ForBlockCount') {
        const initialTransaction = transactions.find(
          (tx) => tx.txid === utxo.outpoint.source_id,
        )

        if (!initialTransaction) return null

        const blocksToUnlock =
          utxo.utxo.lock.content - initialTransaction.confirmations

        if (blocksToUnlock < 0) return null

        const unlockHeight =
          currentHeight -
          initialTransaction.confirmations +
          utxo.utxo.lock.content
        const timestamp =
          parseInt(initialTransaction.date) +
          utxo.utxo.lock.content * BLOCK_TIME_SECONDS
        const progress =
          initialTransaction.confirmations / utxo.utxo.lock.content

        return {
          ...utxo,
          computed: {
            blocksToUnlock,
            unlockHeight,
            timestamp,
            progress: Math.min(progress, 1),
          },
        }
      }

      if (utxo.utxo.lock.type === 'UntilTime') {
        const timestamp = utxo.utxo.lock.content
        const progress = 0.5

        return {
          ...utxo,
          computed: {
            timestamp,
            progress,
          },
        }
      }

      return null
    })
    .filter(Boolean)
    .sort((a, b) => a.computed.timestamp - b.computed.timestamp)

  const totalLocked =
    lockedBalance ||
    updatedUtxosList.reduce(
      (sum, u) => sum + Number(u.utxo.value.amount.decimal),
      0,
    )

  return (
    <div className={styles.wrapper}>
      {fetchingUtxos ? (
        <div className={styles.loadingWrapper}>
          <Loading />
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <LockIcon />
            </div>
            <div className={styles.headerText}>
              <h2>Locked coins</h2>
              <p>
                These coins are time-locked and become spendable automatically
                once their unlock block height is reached on the Mintlayer
                chain.
              </p>
            </div>
          </div>

          <div className={styles.summary}>
            <div>
              <p className={styles.summaryLabel}>Total locked</p>
              <p className={styles.summaryValue}>
                {totalLocked}
                <span>ML</span>
              </p>
            </div>
            {updatedUtxosList.length > 0 && (
              <div className={styles.badge}>
                {updatedUtxosList.length} ACTIVE LOCK
                {updatedUtxosList.length > 1 ? 'S' : ''}
              </div>
            )}
          </div>

          <ul className={styles.list}>
            {updatedUtxosList.map((utxo) => (
              <LockedBalanceListItem
                key={`${utxo.outpoint.source_id}:${utxo.outpoint.index}`}
                utxo={utxo}
              />
            ))}
          </ul>

          <div className={styles.footer}>
            Unlock times are estimates based on the current block production
            rate.
          </div>
        </>
      )}
    </div>
  )
}

export default LockedBalanceList
