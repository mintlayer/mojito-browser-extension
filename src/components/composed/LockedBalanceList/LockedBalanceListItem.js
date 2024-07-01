import { useState, useEffect, useMemo } from 'react'
import { format, addDays } from 'date-fns'
import { Mintlayer } from '@APIs'

import './LockedBalanceListItem.css'

const LockedBalanceListItem = ({ index, utxo, transactions }) => {
  const [initialBlock, setInitialBlock] = useState(null)
  const [unlockDate, setUnlockDate] = useState(null)

  useEffect(() => {
    const getBlockData = async (blockId) => {
      try {
        const blockData = await Mintlayer.getBlockDataByHash(blockId)
        const parsedData = JSON.parse(blockData)
        if (parsedData && parsedData.height) {
          setInitialBlock(parsedData.height)
        }
      } catch (error) {
        console.error('Failed to fetch block data:', error)
      }
    }

    if (utxo.utxo.lock.type === 'ForBlockCount') {
      const initialTransaction = transactions.find(
        (tx) => tx.txid === utxo.outpoint.source_id,
      )
      if (initialTransaction) {
        const calculatedUnlockDate = format(
          addDays(new Date(initialTransaction.date * 1000), 10),
          'dd/MM/yyyy HH:mm',
        )
        getBlockData(initialTransaction.blockId)
        setUnlockDate(calculatedUnlockDate)
      }
    }
  }, [utxo, transactions])

  const displayDate = useMemo(() => {
    if (utxo.utxo.lock.type === 'ForBlockCount' && unlockDate && initialBlock) {
      return `~ ${unlockDate} (Block height: ${Number(initialBlock) + Number(utxo.utxo.lock.content)})`
    } else if (utxo.utxo.lock.type !== 'ForBlockCount') {
      return format(
        new Date(utxo.utxo.lock.content.timestamp * 1000),
        'dd/MM/yyyy HH:mm',
      )
    }
  }, [utxo, unlockDate, initialBlock])

  return (
    <tr
      style={{
        backgroundColor: index % 2 === 0 ? 'white' : 'rgb(247, 250, 250)',
      }}
    >
      <td style={{ padding: '10px' }}>{displayDate}</td>
      <td style={{ padding: '10px' }}>{utxo.utxo.value.amount.decimal} ML</td>
    </tr>
  )
}

export default LockedBalanceListItem
