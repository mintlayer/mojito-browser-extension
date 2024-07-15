import { useMemo } from 'react'
import { format } from 'date-fns'

import './LockedBalanceListItem.css'

const LockedBalanceListItem = ({ index, utxo }) => {

  const displayDate = useMemo(() => {
    if (utxo.utxo.lock.type === 'ForBlockCount') {
      return `~ ${format(
        new Date(utxo.utxo.lock.content.timestamp * 1000),
        'dd/MM/yyyy HH:mm',
      )} (Block height: ${utxo.utxo.lock.content.unlockBlock})`
    } else if (utxo.utxo.lock.type !== 'ForBlockCount') {
      return format(
        new Date(utxo.utxo.lock.content.timestamp * 1000),
        'dd/MM/yyyy HH:mm',
      )
    }
  }, [utxo])

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
