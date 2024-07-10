import React, { useContext, useState, useEffect, useCallback } from 'react'
import { NetworkContext } from '@Contexts'

import { Loading } from '@ComposedComponents'
import { Mintlayer } from '@APIs'
import { addDays } from 'date-fns'
import LockedBalanceListItem from './LockedBalanceListItem'
import './LockedBalanceList.css'

const LockedBalanceList = () => {
  const { lockedUtxos, transactions, fetchingUtxos } =
    useContext(NetworkContext)
  const [loading, setLoading] = useState(false)
  const [updatedUtxosList, setUpdatedUtxosList] = useState([])

  const getBlockData = async (blockId) => {
    try {
      const blockData = await Mintlayer.getBlockDataByHash(blockId)
      const parsedData = JSON.parse(blockData)
      if (parsedData && parsedData.height) {
        return parsedData.height
      }
    } catch (error) {
      console.error('Failed to fetch block data:', error)
    }
  }

  const getUpdatedUtxosWithDate = useCallback(
    async (utxos) => {
      setLoading(true)
      const updatedUtxos = await Promise.all(
        utxos.map(async (utxo) => {
          if (utxo.utxo.lock.type === 'ForBlockCount') {
            const initialTransaction = transactions.find(
              (tx) => tx.txid === utxo.outpoint.source_id,
            )
            if (initialTransaction && !utxo.utxo.lock.content.unlockBlock) {
              // Calculating the unlock date
              const calculatedUnlockTimestamp =
                addDays(
                  new Date(initialTransaction.date * 1000),
                  10,
                ).getTime() / 1000

              const blockData = await getBlockData(initialTransaction.blockId)

                utxo.utxo.lock.content = {
                  lockedFor: utxo.utxo.lock.content,
                  timestamp: calculatedUnlockTimestamp,
                  unlockBlock: blockData + utxo.utxo.lock.content,
                }
            }
          }
          return utxo
        }),
      )
       setLoading(false)
      return updatedUtxos
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lockedUtxos, transactions],
  )

  useEffect(() => {
    const fetchUpdatedUtxos = async () => {
      const updatedUtxos = await getUpdatedUtxosWithDate(lockedUtxos)
      const sortedUtxos = updatedUtxos.sort(
        (a, b) => a.utxo.lock.content.timestamp - b.utxo.lock.content.timestamp,
      )
      setUpdatedUtxosList(sortedUtxos)
    }

    fetchUpdatedUtxos()
  }, [lockedUtxos, transactions, getUpdatedUtxosWithDate])

  return (
    <>
      <div className="locked-table-wrapper">
        {(fetchingUtxos || loading) ? (
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
                <th
                  style={{ padding: '10px', textAlign: 'left' }}
                  className="locked-title"
                >
                  Date
                </th>
                <th
                  style={{ padding: '10px', textAlign: 'left' }}
                  className="locked-title"
                >
                  Amount
                </th>
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
