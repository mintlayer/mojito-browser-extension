import React, { useContext } from 'react'
import { MintlayerContext } from '@Contexts'

import { Loading } from '@ComposedComponents'
import LockedBalanceListItem from './LockedBalanceListItem'
import './LockedBalanceList.css'

const LockedBalanceList = () => {
  const { lockedUtxos, transactions, fetchingUtxos, currentHeight } =
    useContext(MintlayerContext)

  const updatedUtxosList = lockedUtxos
    .map((utxo) => {
      if (utxo.utxo.lock.type === 'ForBlockCount') {
        const initialTransaction = transactions.find(
          (tx) => tx.txid === utxo.outpoint.source_id,
        )

        const blocksToUnlock =
          utxo.utxo.lock.content - initialTransaction.confirmations

        if (blocksToUnlock < 0) {
          return null
        }

        return {
          ...utxo,
          utxo: {
            ...utxo.utxo,
            lock: {
              ...utxo.utxo.lock,
              content: {
                ...utxo.utxo.lock.content,
                blocksToUnlock,
                unlockHeight:
                  currentHeight -
                  initialTransaction.confirmations +
                  utxo.utxo.lock.content,
                timestamp:
                  parseInt(initialTransaction.date) +
                  utxo.utxo.lock.content * 120,
              },
            },
          },
        }
      }

      return {
        ...utxo,
      }
    })
    .reduce((acc, utxo) => (utxo ? [...acc, utxo] : acc), [])
    .sort(
      (a, b) => a.utxo.lock.content.timestamp - b.utxo.lock.content.timestamp,
    )

  return (
    <>
      <div className="locked-table-wrapper">
        {fetchingUtxos ? (
          <div className="locked-loading-wrapper">
            <Loading />
          </div>
        ) : (
          <table
            className="locked-table"
            data-testid="locked-table"
          >
            <thead>
              <tr>
                <th className="locked-title">Date</th>
                <th className="locked-title">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lockedUtxos &&
                updatedUtxosList.map((utxo, index) => (
                  <LockedBalanceListItem
                    key={index}
                    index={index}
                    utxo={utxo}
                    transactions={transactions}
                  />
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}

export default LockedBalanceList
