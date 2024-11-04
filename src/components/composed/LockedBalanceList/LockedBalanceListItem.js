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
      className="locked-balance-list-item"
      style={{
        backgroundColor:
          index % 2 === 0 ? 'rgb(255, 255, 255)' : 'rgba(208, 192, 255, 0.2)',
      }}
    >
      <td
        className="locked-balance-cell"
        style={{ padding: '10px' }}
      >
        {displayDate}
      </td>
      <td style={{ padding: '10px' }}>{utxo.utxo.value.amount.decimal} ML</td>
    </tr>
  )
}

export default LockedBalanceListItem
